"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppointmentsFocusPanel } from "@/components/tenant/appointments-focus-panel";
import type { AppointmentSummary, TenantPublicProfile } from "@/lib/types";

type DashboardSection =
  | "turnos"
  | "agenda"
  | "prestadores"
  | "servicios"
  | "cobros";

type NavigationSection = DashboardSection | "personalizar";

type TenantDashboardShellProps = {
  tenantSlug: string;
  profile: TenantPublicProfile;
  appointments: AppointmentSummary[];
  blockedTimeSlots: Array<{
    id: string;
    title: string;
    reason?: string;
    startsAt: string;
    startsAtIso: string;
    endsAtIso: string;
  }>;
  providers: Array<{
    id: string;
    name: string;
    color?: string;
    isActive: boolean;
  }>;
  session: {
    name: string;
    email: string;
    globalRole: "SUPER_ADMIN" | "TENANT_ADMIN" | "STAFF" | "CUSTOMER";
  };
  reservasActivas: number;
  pagosPendientes: number;
  onlinePaymentServices: number;
  activeProviders: number;
  agendaRulesCount: number;
  agenda: React.ReactNode;
  prestadores: React.ReactNode;
  servicios: React.ReactNode;
  cobros: React.ReactNode;
};

const sectionTitles: Record<NavigationSection, string> = {
  turnos: "Turnos",
  agenda: "Agenda",
  prestadores: "Prestadores",
  servicios: "Servicios",
  cobros: "Cobros",
  personalizar: "Personalizar pagina",
};

const navigationItems: DashboardSection[] = [
  "turnos",
  "agenda",
  "prestadores",
  "servicios",
  "cobros",
];

function SidebarIcon({ section }: { section: NavigationSection }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (section) {
    case "turnos":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="M8.5 14h3M8.5 17h6" />
        </svg>
      );
    case "agenda":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M5 12h14" />
          <path d="M12 5v14" />
          <rect x="4" y="4" width="16" height="16" rx="4" />
        </svg>
      );
    case "prestadores":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
          <circle cx="10" cy="7" r="3" />
          <path d="M20 19v-1a3 3 0 0 0-2-2.8" />
          <path d="M15 4.5a3 3 0 0 1 0 5.8" />
        </svg>
      );
    case "servicios":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M6 7h12" />
          <path d="M6 12h12" />
          <path d="M6 17h8" />
          <circle cx="17" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "cobros":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );
    case "personalizar":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="m12 3 2.1 2.1 3-.5.9 2.8 2.8.9-.5 3L22 12l-2.1 2.1.5 3-2.8.9-.9 2.8-3-.5L12 22l-2.1-2.1-3 .5-.9-2.8-2.8-.9.5-3L2 12l2.1-2.1-.5-3 2.8-.9.9-2.8 3 .5Z" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
  }
}

export function TenantDashboardShell({
  tenantSlug,
  profile,
  appointments,
  blockedTimeSlots,
  providers,
  session,
  reservasActivas,
  pagosPendientes,
  onlinePaymentServices,
  activeProviders,
  agendaRulesCount,
  agenda,
  prestadores,
  servicios,
  cobros,
}: TenantDashboardShellProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>("turnos");

  const overviewChips =
    activeSection === "agenda"
      ? [
          {
            key: "turnos",
            section: "turnos" as const,
            label: "Turnos activos",
            value: reservasActivas,
            tone: "violet",
          },
          {
            key: "horarios",
            section: "agenda" as const,
            label: "Horarios activos",
            value: agendaRulesCount,
            tone: "blue",
          },
          {
            key: "bloqueos",
            section: "cobros" as const,
            label: "Bloqueos activos",
            value: blockedTimeSlots.length,
            tone: "amber",
          },
        ]
      : activeSection === "prestadores"
        ? [
            {
              key: "prestadores",
              section: "prestadores" as const,
              label: "Prestadores activos",
              value: activeProviders,
              tone: "violet",
            },
            {
              key: "turnos",
              section: "turnos" as const,
              label: "Turnos activos",
              value: reservasActivas,
              tone: "blue",
            },
            {
              key: "bloqueos",
              section: "agenda" as const,
              label: "Bloqueos activos",
              value: blockedTimeSlots.length,
              tone: "amber",
            },
          ]
        : activeSection === "cobros"
          ? [
              {
                key: "pendientes",
                section: "cobros" as const,
                label: "Pagos pendientes",
                value: pagosPendientes,
                tone: "violet",
              },
              {
                key: "online",
                section: "servicios" as const,
                label: "Servicios con cobro",
                value: onlinePaymentServices,
                tone: "blue",
              },
              {
                key: "turnos",
                section: "turnos" as const,
                label: "Turnos activos",
                value: reservasActivas,
                tone: "amber",
              },
            ]
          : [
              {
                key: "turnos",
                section: "turnos" as const,
                label: "Turnos activos",
                value: reservasActivas,
                tone: "violet",
              },
              {
                key: "servicios",
                section: "servicios" as const,
                label: "Servicios visibles",
                value: profile.services.length,
                tone: "blue",
              },
              {
                key: "pendientes",
                section: "cobros" as const,
                label: "Pagos pendientes",
                value: pagosPendientes,
                tone: "amber",
              },
            ];

  return (
    <main className="dashboard-app-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          {profile.logoUrl ? (
            <img
              alt={`Logo de ${profile.name}`}
              className="dashboard-sidebar-logo-image"
              src={profile.logoUrl}
            />
          ) : (
            <div className="dashboard-sidebar-logo">{profile.name.charAt(0)}</div>
          )}
          <div>
            <strong>Panel</strong>
            <div className="dashboard-sidebar-subtitle">{profile.name}</div>
          </div>
        </div>

        <nav className="dashboard-sidebar-nav" aria-label="Secciones del panel">
          <div className="dashboard-sidebar-group">
            <span className="dashboard-sidebar-label">Navegacion</span>
            {navigationItems.map((section) => (
              <button
                key={section}
                className={`dashboard-sidebar-item ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
                type="button"
              >
                <span className="dashboard-sidebar-icon" aria-hidden="true">
                  <SidebarIcon section={section} />
                </span>
                <span>{sectionTitles[section]}</span>
              </button>
            ))}
            <Link
              className="dashboard-sidebar-item"
              href={`/app/personalizar?tenant=${tenantSlug}`}
            >
              <span className="dashboard-sidebar-icon" aria-hidden="true">
                <SidebarIcon section="personalizar" />
              </span>
              <span>{sectionTitles.personalizar}</span>
            </Link>
          </div>
        </nav>

        <div className="dashboard-sidebar-footer">
          <span className="dashboard-sidebar-label">Tenant</span>
          <strong>{profile.name}</strong>
          <div className="dashboard-sidebar-subtitle">{profile.slug}</div>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-search">
            <span className="dashboard-topbar-search-icon" />
            <span>{sectionTitles[activeSection]}</span>
          </div>

          <div className="dashboard-topbar-actions">
            <Link className="button secondary" href={`/${profile.slug}`}>
              Ver pagina publica
            </Link>
            {session.globalRole === "SUPER_ADMIN" ? (
              <Link className="button secondary" href="/admin">
                Ir al super admin
              </Link>
            ) : null}
            <div className="dashboard-topbar-user">
              <div>
                <strong>{session.name}</strong>
                <div className="muted">{session.email}</div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="dashboard-content shell">
          <section className="dashboard-overview-header">
            <div>
              <h1>{profile.name}</h1>
            </div>

            <div className="dashboard-overview-actions">
              {overviewChips.map((chip) => (
                <div
                  className={`dashboard-overview-chip dashboard-overview-chip-${chip.tone}`}
                  key={chip.key}
                >
                  <span className="dashboard-overview-chip-icon" aria-hidden="true">
                    <SidebarIcon section={chip.section} />
                  </span>
                  <span className="dashboard-overview-chip-label">{chip.label}</span>
                  <strong>{chip.value}</strong>
                </div>
              ))}
            </div>
          </section>

          {activeSection === "turnos" ? (
            <AppointmentsFocusPanel
              appointments={appointments}
              blockedTimeSlots={blockedTimeSlots}
              providers={providers}
              services={profile.services}
              tenantSlug={tenantSlug}
            />
          ) : null}
          {activeSection === "agenda" ? agenda : null}
          {activeSection === "prestadores" ? prestadores : null}
          {activeSection === "servicios" ? servicios : null}
          {activeSection === "cobros" ? cobros : null}
        </div>
      </div>
    </main>
  );
}
