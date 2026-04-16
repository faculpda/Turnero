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
  startsAtIso: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  providerName?: string;
  priceLabel: string;
};

export type TenantPaymentSettingsSummary = {
  mercadoPagoEnabled: boolean;
  mercadoPagoPublicKey?: string;
  hasMercadoPagoAccessToken: boolean;
  hasMercadoPagoWebhookSecret: boolean;
};

export type HeroLayout = "content-left" | "image-left";
export type SiteTitleScale = "md" | "lg" | "xl";
export type SiteBodyScale = "sm" | "md" | "lg";
export type SiteTextTone = "dark" | "brand" | "muted";
export type SiteSectionWidth = "compact" | "normal" | "wide" | "full";
export type SiteColumnsLayout = "equal" | "feature-left" | "feature-right";
export type SiteCtaTheme = "soft" | "solid";
export type SiteViewport = "desktop" | "tablet" | "mobile";
export type SiteBlockVisibility = Record<SiteViewport, boolean>;

type SiteBlockBase = {
  visibility?: SiteBlockVisibility;
};

export type SiteTextBlock = SiteBlockBase & {
  id: string;
  type: "text";
  eyebrow?: string;
  title: string;
  body: string;
  align?: "left" | "center";
  titleSize?: SiteTitleScale;
  bodySize?: SiteBodyScale;
  tone?: SiteTextTone;
  width?: SiteSectionWidth;
};

export type SiteImageBlock = SiteBlockBase & {
  id: string;
  type: "image";
  imageUrl: string;
  altText?: string;
  caption?: string;
  layout?: "contained" | "wide";
  height?: "small" | "medium" | "large";
};

export type SiteVideoBlock = SiteBlockBase & {
  id: string;
  type: "video";
  title?: string;
  videoUrl: string;
  caption?: string;
  width?: SiteSectionWidth;
};

export type SiteColumnsBlock = SiteBlockBase & {
  id: string;
  type: "columns";
  layout?: SiteColumnsLayout;
  columns: Array<{
    id: string;
    title: string;
    body: string;
  }>;
};

export type SiteCallToActionBlock = SiteBlockBase & {
  id: string;
  type: "cta";
  title: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  titleSize?: SiteTitleScale;
  bodySize?: SiteBodyScale;
  theme?: SiteCtaTheme;
  width?: SiteSectionWidth;
};

export type SiteBuilderBlock =
  | SiteTextBlock
  | SiteImageBlock
  | SiteVideoBlock
  | SiteColumnsBlock
  | SiteCallToActionBlock;

export type TenantPublicProfile = {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  siteTitle?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroLayout?: HeroLayout;
  primaryColor?: string;
  secondaryColor?: string;
  ctaLabel?: string;
  siteBlocks?: SiteBuilderBlock[];
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
