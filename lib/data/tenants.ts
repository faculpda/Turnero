import { Prisma } from "@prisma/client";
import {
  tenantAppointments as fallbackAppointments,
  tenantPublicProfile as fallbackPublicProfile,
  tenants as fallbackTenants,
} from "@/lib/mock-data";
import { generateAvailableSlotsForService } from "@/lib/availability";
import { formatAppointmentDate, formatPrice } from "@/lib/format";
import { buildAppointmentActiveFilter } from "@/lib/payments/mercadopago";
import { prisma } from "@/lib/prisma";
import type {
  AppointmentSummary,
  CustomerAppointmentSummary,
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
  ...publicTenantInclude,
  appointments: {
    orderBy: {
      startsAt: "asc",
    },
    take: 10,
    include: {
      service: true,
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

function mapPublicTenant(
  tenant: Prisma.TenantGetPayload<{ include: typeof publicTenantInclude }>,
): TenantPublicProfile {
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
    primaryColor: tenant.primaryColor ?? undefined,
    secondaryColor: tenant.secondaryColor ?? undefined,
    ctaLabel: tenant.ctaLabel ?? "Reservar turno",
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
    })),
    nextSlots: buildPreviewSlots(tenant.availability),
  };
}

function mapAppointments(
  appointments: Prisma.TenantGetPayload<{ include: typeof dashboardTenantInclude }>["appointments"],
): AppointmentSummary[] {
  return appointments.map((appointment) => ({
    id: appointment.id,
    serviceName: appointment.service.name,
    customerName: appointment.customerProfile.user.name,
    startsAt: formatAppointmentDate(appointment.startsAt),
    status: appointment.status,
    paymentStatus: appointment.paymentStatus,
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
        appointments: fallbackAppointments,
      };
    }

    return {
      profile: mapPublicTenant(tenant),
      appointments: mapAppointments(tenant.appointments),
    };
  } catch {
    return {
      profile: fallbackPublicProfile,
      appointments: fallbackAppointments,
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
      },
      slots: generateAvailableSlotsForService(
        { durationMin: service.durationMin },
        tenant.availability,
        tenant.appointments,
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
