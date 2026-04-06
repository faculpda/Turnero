export type TenantStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

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
  durationMin: number;
  priceLabel: string;
};

export type AppointmentSummary = {
  id: string;
  serviceName: string;
  customerName: string;
  startsAt: string;
  status: AppointmentStatus;
};

export type TenantPublicProfile = {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  services: ServiceSummary[];
  nextSlots: string[];
};
