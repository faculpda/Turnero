import { Prisma } from "@prisma/client";
import {
  tenantAppointments as fallbackAppointments,
  tenantBlockedTimeSlots as fallbackBlockedTimeSlots,
  tenantProviders as fallbackProviders,
  tenantPublicProfile as fallbackPublicProfile,
  tenants as fallbackTenants,
} from "@/lib/mock-data";
import { processDueAppointmentReminders } from "@/lib/appointments";
import { generateAvailableSlotsForService } from "@/lib/availability";
import { formatAppointmentDate, formatPrice } from "@/lib/format";
import { buildAppointmentActiveFilter } from "@/lib/payments/mercadopago";
import { prisma } from "@/lib/prisma";
import type {
  AppointmentSummary,
  CustomerAppointmentSummary,
  SiteBuilderBlock,
  TenantBookingData,
  TenantDashboardData,
  TenantPublicProfile,
  TenantSummary,
} from "@/lib/types";

const adminTenantInclude = {
  domains: {
    where: {
      isPrimary: true,
    },
    take: 1,
  },
  _count: {
    select: {
      appointments: true,
    },
  },
} satisfies Prisma.TenantInclude;

const publicTenantInclude = {
  services: {
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  },
  availability: {
    where: {
      isActive: true,
    },
    orderBy: [
      {
        dayOfWeek: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  },
} satisfies Prisma.TenantInclude;

const dashboardTenantInclude = {
  services: {
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  },
  availability: publicTenantInclude.availability,
  blockedTimeSlots: {
    orderBy: {
      startsAt: "asc",
    },
  },
  providers: {
    orderBy: {
      createdAt: "asc",
    },
  },
  appointments: {
    orderBy: {
      startsAt: "asc",
    },
    take: 30,
    include: {
      service: true,
      provider: true,
      events: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          actorUser: {
            select: {
              name: true,
            },
          },
        },
      },
      reminders: {
        orderBy: {
          scheduledFor: "asc",
        },
        take: 10,
      },
      customerProfile: {
        include: {
          user: true,
        },
      },
    },
  },
} satisfies Prisma.TenantInclude;

const bookingTenantInclude = {
  ...publicTenantInclude,
  blockedTimeSlots: {
    select: {
      startsAt: true,
      endsAt: true,
    },
  },
  appointments: {
    where: buildAppointmentActiveFilter(),
    select: {
      startsAt: true,
      endsAt: true,
      status: true,
      paymentExpiresAt: true,
    },
  },
} satisfies Prisma.TenantInclude;

function buildPreviewSlots(
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    slotStepMin: number;
  }>,
): string[] {
  const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

  return availability.slice(0, 4).flatMap((rule) => {
    const [hour, minute] = rule.startTime.split(":").map(Number);

    return Array.from({ length: 2 }, (_, index) => {
      const totalMinutes = hour * 60 + minute + index * rule.slotStepMin;
      const slotHour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
      const slotMinute = String(totalMinutes % 60).padStart(2, "0");
      return `${dayLabels[rule.dayOfWeek]} - ${slotHour}:${slotMinute}`;
    });
  });
}

function mapAdminTenant(
  tenant: Prisma.TenantGetPayload<{ include: typeof adminTenantInclude }>,
): TenantSummary {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    domain: tenant.domains[0]?.host,
    upcomingAppointments: tenant._count.appointments,
  };
}

type TenantProfileRecord = {
  id: string;
  name: string;
  slug: string;
  heroTitle: string | null;
  heroDescription: string | null;
  publicDescription: string | null;
  siteTitle: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  heroLayout: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  ctaLabel: string | null;
  siteBlocks: Prisma.JsonValue | null;
  mercadoPagoEnabled?: boolean | null;
  mercadoPagoPublicKey?: string | null;
  mercadoPagoAccessToken?: string | null;
  mercadoPagoWebhookSecret?: string | null;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    slotStepMin: number;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMin: number;
    priceCents: number | null;
    isActive: boolean;
    images: Array<{
      id: string;
      url: string;
      altText: string | null;
    }>;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseVisibility(
  input: unknown,
): { desktop: boolean; tablet: boolean; mobile: boolean } | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const desktop = typeof input.desktop === "boolean" ? input.desktop : true;
  const tablet = typeof input.tablet === "boolean" ? input.tablet : true;
  const mobile = typeof input.mobile === "boolean" ? input.mobile : true;

  return { desktop, tablet, mobile };
}

function parseSiteBlocks(input: Prisma.JsonValue | null | undefined): SiteBuilderBlock[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<SiteBuilderBlock[]>((blocks, item) => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.type !== "string") {
      return blocks;
    }

    if (item.type === "text" && typeof item.title === "string" && typeof item.body === "string") {
      blocks.push({
        id: item.id,
        type: "text",
        eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : undefined,
        title: item.title,
        body: item.body,
        align: item.align === "center" ? "center" : "left",
        titleSize:
          item.titleSize === "md" || item.titleSize === "lg" || item.titleSize === "xl"
            ? item.titleSize
            : "lg",
        bodySize:
          item.bodySize === "sm" || item.bodySize === "md" || item.bodySize === "lg"
            ? item.bodySize
            : "md",
        tone:
          item.tone === "brand" || item.tone === "muted" || item.tone === "dark"
            ? item.tone
            : "dark",
        width:
          item.width === "compact" || item.width === "wide" || item.width === "full"
            ? item.width
            : "normal",
        visibility: parseVisibility(item.visibility),
      });
      return blocks;
    }

    if (item.type === "image" && typeof item.imageUrl === "string") {
      blocks.push({
        id: item.id,
        type: "image",
        imageUrl: item.imageUrl,
        altText: typeof item.altText === "string" ? item.altText : undefined,
        caption: typeof item.caption === "string" ? item.caption : undefined,
        layout: item.layout === "wide" ? "wide" : "contained",
        height: item.height === "small" || item.height === "large" ? item.height : "medium",
        visibility: parseVisibility(item.visibility),
      });
      return blocks;
    }

    if (item.type === "video" && typeof item.videoUrl === "string") {
      blocks.push({
        id: item.id,
        type: "video",
        title: typeof item.title === "string" ? item.title : undefined,
        videoUrl: item.videoUrl,
        caption: typeof item.caption === "string" ? item.caption : undefined,
        width:
          item.width === "compact" || item.width === "wide" || item.width === "full"
            ? item.width
            : "normal",
        visibility: parseVisibility(item.visibility),
      });
      return blocks;
    }

    if (item.type === "columns" && Array.isArray(item.columns)) {
      const columns = item.columns.flatMap((column) => {
        if (!isRecord(column) || typeof column.id !== "string") {
          return [];
        }

        if (typeof column.title !== "string" || typeof column.body !== "string") {
          return [];
        }

        return [
          {
            id: column.id,
            title: column.title,
            body: column.body,
          },
        ];
      });

      if (columns.length > 0) {
        blocks.push({
          id: item.id,
          type: "columns",
          layout:
            item.layout === "feature-left" || item.layout === "feature-right"
              ? item.layout
              : "equal",
          columns,
          visibility: parseVisibility(item.visibility),
        });
      }

      return blocks;
    }

    if (
      item.type === "cta" &&
      typeof item.title === "string" &&
      typeof item.body === "string" &&
      typeof item.buttonLabel === "string" &&
      typeof item.buttonHref === "string"
    ) {
      blocks.push({
        id: item.id,
        type: "cta",
        title: item.title,
        body: item.body,
        buttonLabel: item.buttonLabel,
        buttonHref: item.buttonHref,
        titleSize:
          item.titleSize === "md" || item.titleSize === "lg" || item.titleSize === "xl"
            ? item.titleSize
            : "lg",
        bodySize:
          item.bodySize === "sm" || item.bodySize === "md" || item.bodySize === "lg"
            ? item.bodySize
            : "md",
        theme: item.theme === "solid" ? "solid" : "soft",
        width:
          item.width === "compact" || item.width === "wide" || item.width === "full"
            ? item.width
            : "normal",
        visibility: parseVisibility(item.visibility),
      });
    }

    return blocks;
  }, []);
}

function mapPublicTenant(tenant: TenantProfileRecord): TenantPublicProfile {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    headline: tenant.heroTitle ?? "Reserva tu turno en pocos pasos",
    description:
      tenant.heroDescription ??
      tenant.publicDescription ??
      "Selecciona el servicio, elige una fecha disponible y confirma tu turno online.",
    siteTitle: tenant.siteTitle ?? tenant.name,
    logoUrl: tenant.logoUrl ?? undefined,
    heroImageUrl: tenant.heroImageUrl ?? undefined,
    heroLayout: tenant.heroLayout === "image-left" ? "image-left" : "content-left",
    primaryColor: tenant.primaryColor ?? undefined,
    secondaryColor: tenant.secondaryColor ?? undefined,
    ctaLabel: tenant.ctaLabel ?? "Reservar turno",
    siteBlocks: parseSiteBlocks(tenant.siteBlocks),
    paymentSettings: "mercadoPagoEnabled" in tenant
      ? {
          mercadoPagoEnabled: tenant.mercadoPagoEnabled ?? false,
          mercadoPagoPublicKey: tenant.mercadoPagoPublicKey ?? undefined,
          hasMercadoPagoAccessToken: Boolean(tenant.mercadoPagoAccessToken),
          hasMercadoPagoWebhookSecret: Boolean(tenant.mercadoPagoWebhookSecret),
        }
      : undefined,
    services: tenant.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? undefined,
      durationMin: service.durationMin,
      priceLabel: formatPrice(service.priceCents),
      priceCents: service.priceCents,
      isActive: service.isActive,
      images: service.images.map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.altText ?? undefined,
      })),
    })),
    nextSlots: buildPreviewSlots(tenant.availability),
  };
}

function mapAppointments(
  appointments: Prisma.TenantGetPayload<{ include: typeof dashboardTenantInclude }>["appointments"],
): AppointmentSummary[] {
  return appointments.map((appointment) => ({
    id: appointment.id,
    serviceId: appointment.serviceId,
    serviceName: appointment.service.name,
    providerId: appointment.providerId ?? undefined,
    providerName: appointment.provider?.name ?? undefined,
    providerColor: appointment.provider?.color ?? undefined,
    customerName: appointment.customerProfile.user.name,
    customerEmail: appointment.customerProfile.user.email,
    customerPhone: appointment.customerProfile.phone ?? undefined,
    startsAt: formatAppointmentDate(appointment.startsAt),
    startsAtIso: appointment.startsAt.toISOString(),
    status: appointment.status,
    paymentStatus: appointment.paymentStatus,
    notes: appointment.notes ?? undefined,
    isLate:
      (appointment.status === "PENDING" || appointment.status === "CONFIRMED") &&
      appointment.startsAt < new Date(),
    events: appointment.events.map((event) => ({
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description ?? undefined,
      createdAt: event.createdAt.toISOString(),
      actorName: event.actorUser?.name ?? undefined,
    })),
    reminders: appointment.reminders.map((reminder) => ({
      id: reminder.id,
      channel: reminder.channel,
      status: reminder.status,
      scheduledFor: reminder.scheduledFor.toISOString(),
      target: reminder.target,
      sentAt: reminder.sentAt?.toISOString(),
      errorMessage: reminder.errorMessage ?? undefined,
    })),
  }));
}

export async function listAdminTenants(): Promise<TenantSummary[]> {
  try {
    const tenants = await prisma.tenant.findMany({
      include: adminTenantInclude,
      orderBy: {
        createdAt: "asc",
      },
    });

    return tenants.length > 0 ? tenants.map(mapAdminTenant) : fallbackTenants;
  } catch {
    return fallbackTenants;
  }
}

export async function getPublicTenantProfile(
  slug: string,
): Promise<TenantPublicProfile | undefined> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug,
      },
      include: publicTenantInclude,
    });

    if (!tenant) {
      return fallbackPublicProfile.slug === slug ? fallbackPublicProfile : undefined;
    }

    return mapPublicTenant(tenant);
  } catch {
    return fallbackPublicProfile.slug === slug ? fallbackPublicProfile : undefined;
  }
}

export async function getPublicTenantProfileByHost(
  host: string,
): Promise<TenantPublicProfile | undefined> {
  try {
    const tenantDomain = await prisma.tenantDomain.findUnique({
      where: {
        host,
      },
      include: {
        tenant: {
          include: publicTenantInclude,
        },
      },
    });

    if (!tenantDomain) {
      return fallbackPublicProfile.slug === host ? fallbackPublicProfile : undefined;
    }

    return mapPublicTenant(tenantDomain.tenant);
  } catch {
    const fallbackTenant = fallbackTenants.find((tenant) => tenant.domain === host);
    return fallbackTenant?.slug === fallbackPublicProfile.slug ? fallbackPublicProfile : undefined;
  }
}

export async function getTenantDashboardData(
  slug = "dentista",
): Promise<TenantDashboardData> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug,
      },
      include: dashboardTenantInclude,
    });

    if (!tenant) {
      return {
        profile: fallbackPublicProfile,
        providers: fallbackProviders,
        appointments: fallbackAppointments,
        blockedTimeSlots: fallbackBlockedTimeSlots,
        availabilityRules: [],
      };
    }

    await processDueAppointmentReminders(tenant.id);

    const refreshedTenant = await prisma.tenant.findUnique({
      where: {
        slug,
      },
      include: dashboardTenantInclude,
    });

    if (!refreshedTenant) {
      return {
        profile: fallbackPublicProfile,
        providers: fallbackProviders,
        appointments: fallbackAppointments,
        blockedTimeSlots: fallbackBlockedTimeSlots,
        availabilityRules: [],
      };
    }

    return {
      profile: mapPublicTenant(refreshedTenant),
      providers: refreshedTenant.providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        email: provider.email ?? undefined,
        phone: provider.phone ?? undefined,
        color: provider.color ?? undefined,
        isActive: provider.isActive,
      })),
      appointments: mapAppointments(refreshedTenant.appointments),
      blockedTimeSlots: refreshedTenant.blockedTimeSlots.map((blockedTimeSlot) => ({
        id: blockedTimeSlot.id,
        title: blockedTimeSlot.title,
        reason: blockedTimeSlot.reason ?? undefined,
        startsAt: formatAppointmentDate(blockedTimeSlot.startsAt),
        startsAtIso: blockedTimeSlot.startsAt.toISOString(),
        endsAtIso: blockedTimeSlot.endsAt.toISOString(),
      })),
      availabilityRules: refreshedTenant.availability.map((rule) => ({
        id: rule.id,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        slotStepMin: rule.slotStepMin,
        isActive: rule.isActive,
      })),
    };
  } catch {
    return {
      profile: fallbackPublicProfile,
      providers: fallbackProviders,
      appointments: fallbackAppointments,
      blockedTimeSlots: fallbackBlockedTimeSlots,
      availabilityRules: [],
    };
  }
}

export async function getTenantBookingData(
  slug: string,
): Promise<TenantBookingData | undefined> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug,
      },
      include: bookingTenantInclude,
    });

    if (!tenant) {
      if (fallbackPublicProfile.slug !== slug) {
        return undefined;
      }

      return {
        profile: fallbackPublicProfile,
        availabilityByService: fallbackPublicProfile.services.map((service) => ({
          service,
          slots: fallbackPublicProfile.nextSlots.map((slot, index) => ({
            startsAt: `mock-${service.id}-${index}`,
            endsAt: `mock-${service.id}-${index + 1}`,
            label: slot,
          })),
        })),
      };
    }

    const profile = mapPublicTenant(tenant);
    const availabilityByService = tenant.services.map((service) => ({
      service: {
        id: service.id,
        name: service.name,
        description: service.description ?? undefined,
        durationMin: service.durationMin,
        priceLabel: formatPrice(service.priceCents),
        priceCents: service.priceCents,
        isActive: service.isActive,
        images: service.images.map((image) => ({
          id: image.id,
          url: image.url,
          altText: image.altText ?? undefined,
        })),
      },
      slots: generateAvailableSlotsForService(
        { durationMin: service.durationMin },
        tenant.availability,
        tenant.appointments,
        tenant.blockedTimeSlots,
      ),
    }));

    return {
      profile,
      availabilityByService,
    };
  } catch {
    if (fallbackPublicProfile.slug !== slug) {
      return undefined;
    }

    return {
      profile: fallbackPublicProfile,
      availabilityByService: fallbackPublicProfile.services.map((service) => ({
        service,
        slots: fallbackPublicProfile.nextSlots.map((slot, index) => ({
          startsAt: `mock-${service.id}-${index}`,
          endsAt: `mock-${service.id}-${index + 1}`,
          label: slot,
        })),
      })),
    };
  }
}

export async function getTenantBookingDataByHost(
  host: string,
): Promise<TenantBookingData | undefined> {
  const profile = await getPublicTenantProfileByHost(host);

  if (!profile) {
    return undefined;
  }

  return getTenantBookingData(profile.slug);
}

export async function listCustomerAppointments(
  userId: string,
  tenantSlug: string,
): Promise<CustomerAppointmentSummary[]> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        customerProfile: {
          userId,
          tenant: {
            slug: tenantSlug,
          },
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        startsAt: "asc",
      },
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      serviceName: appointment.service.name,
      startsAt: formatAppointmentDate(appointment.startsAt),
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
    }));
  } catch {
    return [
      {
        id: "fallback-customer-1",
        serviceName: "Limpieza dental",
        startsAt: "Mar 7 abr, 09:00",
        status: "CONFIRMED",
        paymentStatus: "APPROVED",
      },
    ];
  }
}
