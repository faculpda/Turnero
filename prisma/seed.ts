import {
  AppointmentEventType,
  AppointmentStatus,
  PrismaClient,
  ReminderChannel,
  ReminderStatus,
  TenantStatus,
  UserRole,
} from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "dentista" },
    update: {
      name: "Clinica Dental Sonrisa",
      status: TenantStatus.ACTIVE,
      primaryColor: "#205fc0",
      secondaryColor: "#dff1ff",
      siteTitle: "Clinica Dental Sonrisa",
      heroTitle: "Reserva tu turno odontologico de forma simple",
      heroDescription:
        "Atencion profesional, horarios claros y una experiencia de reserva moderna para tus pacientes.",
      ctaLabel: "Solicitar turno",
      logoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=300&q=80",
      heroImageUrl:
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
      publicDescription:
        "Selecciona el servicio, elige una fecha disponible y confirma tu turno online.",
      timezone: "America/Argentina/Buenos_Aires",
    },
    create: {
      name: "Clinica Dental Sonrisa",
      slug: "dentista",
      status: TenantStatus.ACTIVE,
      primaryColor: "#205fc0",
      secondaryColor: "#dff1ff",
      siteTitle: "Clinica Dental Sonrisa",
      heroTitle: "Reserva tu turno odontologico de forma simple",
      heroDescription:
        "Atencion profesional, horarios claros y una experiencia de reserva moderna para tus pacientes.",
      ctaLabel: "Solicitar turno",
      logoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=300&q=80",
      heroImageUrl:
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
      publicDescription:
        "Selecciona el servicio, elige una fecha disponible y confirma tu turno online.",
      timezone: "America/Argentina/Buenos_Aires",
      domains: {
        create: {
          host: "dentista.com",
          verified: false,
          isPrimary: true,
        },
      },
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@turnero.com" },
    create: {
      name: "Super Admin",
      email: "admin@turnero.com",
      globalRole: UserRole.SUPER_ADMIN,
      passwordHash: hashPassword("Admin1234!"),
    },
    update: {
      name: "Super Admin",
      globalRole: UserRole.SUPER_ADMIN,
      passwordHash: hashPassword("Admin1234!"),
    },
  });

  const tenantAdmin = await prisma.user.upsert({
    where: { email: "admin@dentista.com" },
    create: {
      name: "Dra. Paula Gomez",
      email: "admin@dentista.com",
      globalRole: UserRole.TENANT_ADMIN,
      passwordHash: hashPassword("Dentista1234!"),
    },
    update: {
      name: "Dra. Paula Gomez",
      globalRole: UserRole.TENANT_ADMIN,
      passwordHash: hashPassword("Dentista1234!"),
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: tenantAdmin.id,
        tenantId: tenant.id,
      },
    },
    update: {
      role: UserRole.TENANT_ADMIN,
    },
    create: {
      userId: tenantAdmin.id,
      tenantId: tenant.id,
      role: UserRole.TENANT_ADMIN,
    },
  });

  const [cleaning, checkup, whitening] = await Promise.all([
    prisma.service.upsert({
      where: { id: "srv_limpieza" },
      update: {
        name: "Limpieza dental",
        durationMin: 30,
        priceCents: 2500000,
        isActive: true,
        sortOrder: 1,
      },
      create: {
        id: "srv_limpieza",
        tenantId: tenant.id,
        name: "Limpieza dental",
        durationMin: 30,
        priceCents: 2500000,
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.service.upsert({
      where: { id: "srv_control" },
      update: {
        name: "Control general",
        durationMin: 45,
        priceCents: 3200000,
        isActive: true,
        sortOrder: 2,
      },
      create: {
        id: "srv_control",
        tenantId: tenant.id,
        name: "Control general",
        durationMin: 45,
        priceCents: 3200000,
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.service.upsert({
      where: { id: "srv_blanqueamiento" },
      update: {
        name: "Blanqueamiento",
        durationMin: 60,
        priceCents: 4800000,
        isActive: true,
        sortOrder: 3,
      },
      create: {
        id: "srv_blanqueamiento",
        tenantId: tenant.id,
        name: "Blanqueamiento",
        durationMin: 60,
        priceCents: 4800000,
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);

  await prisma.serviceImage.deleteMany({
    where: {
      service: {
        tenantId: tenant.id,
      },
    },
  });

  await prisma.serviceImage.createMany({
    data: [
      {
        serviceId: cleaning.id,
        url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=900&q=80",
        altText: "Limpieza dental profesional",
        sortOrder: 1,
      },
      {
        serviceId: checkup.id,
        url: "https://images.unsplash.com/photo-1588776814546-daab30f310ce?auto=format&fit=crop&w=900&q=80",
        altText: "Control odontologico general",
        sortOrder: 1,
      },
      {
        serviceId: whitening.id,
        url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=80",
        altText: "Blanqueamiento dental",
        sortOrder: 1,
      },
    ],
  });

  await prisma.availabilityRule.deleteMany({
    where: {
      tenantId: tenant.id,
    },
  });

  await prisma.availabilityRule.createMany({
    data: [
      {
        tenantId: tenant.id,
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "13:00",
        slotStepMin: 30,
      },
      {
        tenantId: tenant.id,
        dayOfWeek: 3,
        startTime: "14:00",
        endTime: "18:00",
        slotStepMin: 30,
      },
    ],
  });

  await prisma.blockedTimeSlot.deleteMany({
    where: {
      tenantId: tenant.id,
    },
  });

  await prisma.blockedTimeSlot.create({
    data: {
      tenantId: tenant.id,
      createdByUserId: tenantAdmin.id,
      title: "Almuerzo del equipo",
      reason: "Pausa interna",
      startsAt: new Date("2026-04-07T13:00:00.000Z"),
      endsAt: new Date("2026-04-07T14:00:00.000Z"),
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "maria@example.com" },
    create: {
      name: "Maria Gomez",
      email: "maria@example.com",
      globalRole: UserRole.CUSTOMER,
      passwordHash: hashPassword("Paciente1234!"),
    },
    update: {
      name: "Maria Gomez",
      globalRole: UserRole.CUSTOMER,
      passwordHash: hashPassword("Paciente1234!"),
    },
  });

  const customerProfile = await prisma.customerProfile.upsert({
    where: {
      userId_tenantId: {
        userId: customerUser.id,
        tenantId: tenant.id,
      },
    },
    update: {
      phone: "+54 11 5555 5555",
    },
    create: {
      userId: customerUser.id,
      tenantId: tenant.id,
      phone: "+54 11 5555 5555",
    },
  });

  await prisma.appointment.deleteMany({
    where: {
      tenantId: tenant.id,
    },
  });

  await prisma.appointment.createMany({
    data: [
      {
        tenantId: tenant.id,
        serviceId: cleaning.id,
        customerProfileId: customerProfile.id,
        startsAt: new Date("2026-04-07T12:00:00.000Z"),
        endsAt: new Date("2026-04-07T12:30:00.000Z"),
        status: AppointmentStatus.CONFIRMED,
      },
      {
        tenantId: tenant.id,
        serviceId: checkup.id,
        customerProfileId: customerProfile.id,
        startsAt: new Date("2026-04-07T14:30:00.000Z"),
        endsAt: new Date("2026-04-07T15:15:00.000Z"),
        status: AppointmentStatus.PENDING,
      },
      {
        tenantId: tenant.id,
        serviceId: whitening.id,
        customerProfileId: customerProfile.id,
        startsAt: new Date("2026-04-08T17:00:00.000Z"),
        endsAt: new Date("2026-04-08T18:00:00.000Z"),
        status: AppointmentStatus.CONFIRMED,
      },
    ],
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      service: true,
      customerProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  await prisma.appointmentEvent.deleteMany({
    where: {
      tenantId: tenant.id,
    },
  });

  await prisma.appointmentReminder.deleteMany({
    where: {
      tenantId: tenant.id,
    },
  });

  for (const appointment of appointments) {
    await prisma.appointmentEvent.create({
      data: {
        appointmentId: appointment.id,
        tenantId: tenant.id,
        actorUserId: tenantAdmin.id,
        type: AppointmentEventType.CREATED,
        title: "Turno creado",
        description: `Reserva inicial para ${appointment.service.name}.`,
      },
    });

    if (appointment.customerProfile.user.email) {
      await prisma.appointmentReminder.create({
        data: {
          appointmentId: appointment.id,
          tenantId: tenant.id,
          channel: ReminderChannel.EMAIL,
          status: ReminderStatus.SCHEDULED,
          scheduledFor: new Date(appointment.startsAt.getTime() - 24 * 60 * 60 * 1000),
          target: appointment.customerProfile.user.email,
          message: `Recordatorio de turno para ${appointment.customerProfile.user.name}.`,
        },
      });
    }
  }

  console.log(
    `Seed listo para tenant ${tenant.slug}, tenant admin ${tenantAdmin.email} y super admin ${superAdmin.email}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
