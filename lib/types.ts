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

export type AppointmentEventType =
  | "CREATED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED"
  | "NOTES_UPDATED"
  | "REMINDER_SCHEDULED"
  | "REMINDER_SENT"
  | "REMINDER_FAILED";

export type ReminderChannel = "EMAIL" | "WHATSAPP";

export type ReminderStatus = "SCHEDULED" | "SENT" | "FAILED" | "CANCELLED";

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
  serviceId: string;
  providerId?: string;
  providerName?: string;
  providerColor?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startsAt: string;
  startsAtIso: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  isLate?: boolean;
  events: Array<{
    id: string;
    type: AppointmentEventType;
    title: string;
    description?: string;
    createdAt: string;
    actorName?: string;
  }>;
  reminders: Array<{
    id: string;
    channel: ReminderChannel;
    status: ReminderStatus;
    scheduledFor: string;
    target: string;
    sentAt?: string;
    errorMessage?: string;
  }>;
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
  providers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    color?: string;
    isActive: boolean;
  }>;
  appointments: AppointmentSummary[];
  blockedTimeSlots: Array<{
    id: string;
    title: string;
    reason?: string;
    startsAt: string;
    startsAtIso: string;
    endsAtIso: string;
  }>;
};

export type TenantBookingData = {
  profile: TenantPublicProfile;
  availabilityByService: ServiceAvailability[];
};
