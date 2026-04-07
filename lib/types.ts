export type TenantStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type PaymentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  domain?: string;
  upcomingAppointments: number;
};

export type ServiceSummary = {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  priceLabel: string;
  priceCents?: number | null;
  isActive?: boolean;
  images?: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
};

export type AppointmentSummary = {
  id: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startsAt: string;
  startsAtIso: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
};

export type CustomerAppointmentSummary = {
  id: string;
  serviceName: string;
  startsAt: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
};

export type TenantPaymentSettingsSummary = {
  mercadoPagoEnabled: boolean;
  mercadoPagoPublicKey?: string;
  hasMercadoPagoAccessToken: boolean;
  hasMercadoPagoWebhookSecret: boolean;
};

export type TenantPublicProfile = {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  siteTitle?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  ctaLabel?: string;
  paymentSettings?: TenantPaymentSettingsSummary;
  services: ServiceSummary[];
  nextSlots: string[];
};

export type BookingSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

export type ServiceAvailability = {
  service: ServiceSummary;
  slots: BookingSlot[];
};

export type TenantDashboardData = {
  profile: TenantPublicProfile;
  appointments: AppointmentSummary[];
};

export type TenantBookingData = {
  profile: TenantPublicProfile;
  availabilityByService: ServiceAvailability[];
};
