import type {
  AppointmentSummary,
  TenantPublicProfile,
  TenantSummary,
} from "@/lib/types";

export const tenants: TenantSummary[] = [
  {
    id: "tenant_dentista",
    name: "Clinica Dental Sonrisa",
    slug: "dentista",
    status: "ACTIVE",
    domain: "dentista.com",
    upcomingAppointments: 18,
  },
  {
    id: "tenant_abogado",
    name: "Estudio Lopez & Asociados",
    slug: "abogado",
    status: "TRIAL",
    domain: undefined,
    upcomingAppointments: 4,
  },
];

export const tenantAppointments: AppointmentSummary[] = [
  {
    id: "app_1",
    serviceName: "Limpieza dental",
    customerName: "Maria Gomez",
    startsAt: "2026-04-07 09:00",
    status: "CONFIRMED",
    paymentStatus: "APPROVED",
  },
  {
    id: "app_2",
    serviceName: "Control general",
    customerName: "Juan Perez",
    startsAt: "2026-04-07 11:30",
    status: "CONFIRMED",
    paymentStatus: "NOT_REQUIRED",
  },
  {
    id: "app_3",
    serviceName: "Blanqueamiento",
    customerName: "Lucia Diaz",
    startsAt: "2026-04-07 16:00",
    status: "PENDING",
    paymentStatus: "PENDING",
  },
];

export const tenantPublicProfile: TenantPublicProfile = {
  id: "tenant_dentista",
  name: "Clinica Dental Sonrisa",
  slug: "dentista",
  headline: "Reserva tu turno en pocos pasos",
  description:
    "Selecciona el servicio, elige una fecha disponible y confirma tu turno online.",
  paymentSettings: {
    mercadoPagoEnabled: false,
    hasMercadoPagoAccessToken: false,
    hasMercadoPagoWebhookSecret: false,
  },
  services: [
    {
      id: "srv_1",
      name: "Limpieza dental",
      durationMin: 30,
      priceLabel: "$25.000",
      priceCents: 2500000,
    },
    {
      id: "srv_2",
      name: "Control general",
      durationMin: 45,
      priceLabel: "$32.000",
      priceCents: 3200000,
    },
    {
      id: "srv_3",
      name: "Blanqueamiento",
      durationMin: 60,
      priceLabel: "$48.000",
      priceCents: 4800000,
    },
  ],
  nextSlots: [
    "Martes 7 - 09:00",
    "Martes 7 - 09:30",
    "Martes 7 - 10:00",
    "Miercoles 8 - 14:00",
  ],
};
