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
  | "cobros"
  | "personalizar";

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
  agenda: React.ReactNode;
  prestadores: React.ReactNode;
  servicios: React.ReactNode;
  cobros: React.ReactNode;
  personalizar: React.ReactNode;
};

const sectionTitles: Record<DashboardSection, string> = {
  turnos: "Turnos",
  agenda: "Agenda",
  prestadores: "Prestadores",
  servicios: "Servicios",
  cobros: "Cobros",
  personalizar: "Personalizar pagina",
};

export function TenantDashboardShell({
  tenantSlug,
  profile,
  appointments,
  blockedTimeSlots,
  providers,
  session,
  reservasActivas,
  pagosPendientes,
  agenda,
  prestadores,
  servicios,
  cobros,
  personalizar,
}: TenantDashboardShellProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>("turnos");

  return (
    <main className="dashboard-app-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <div className="dashboard-sidebar-logo">T</div>
          <div>
            <strong>Turnero</strong>
            <div className="dashboard-sidebar-subtitle">Panel profesional</div>
          </div>
        </div>

        <nav className="dashboard-sidebar-nav" aria-label="Secciones del panel">
          <div className="dashboard-sidebar-group">
            <span className="dashboard-sidebar-label">Navegacion</span>
            {(
              ["turnos", "agenda", "prestadores", "servicios", "cobros", "personalizar"] as DashboardSection[]
            ).map(
              (section) => (
                <button
                  key={section}
                  className={`dashboard-sidebar-item ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                  type="button"
                >
                  <span className="dashboard-sidebar-icon" />
                  <span>{sectionTitles[section]}</span>
                </button>
              ),
            )}
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
              <span className="eyebrow">Panel del tenant</span>
              <h1>{profile.name}</h1>
              <p className="muted dashboard-overview-copy">
                Un tablero claro para controlar reservas activas, atender clientes y gestionar el
                negocio desde una sola barra lateral.
              </p>
            </div>

            <div className="dashboard-overview-actions">
              <div className="dashboard-overview-chip dashboard-overview-chip-violet">
                <span className="dashboard-overview-chip-label">Turnos activos</span>
                <strong>{reservasActivas}</strong>
              </div>
              <div className="dashboard-overview-chip dashboard-overview-chip-blue">
                <span className="dashboard-overview-chip-label">Servicios visibles</span>
                <strong>{profile.services.length}</strong>
              </div>
              <div className="dashboard-overview-chip dashboard-overview-chip-amber">
                <span className="dashboard-overview-chip-label">Pagos pendientes</span>
                <strong>{pagosPendientes}</strong>
              </div>
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
          {activeSection === "personalizar" ? personalizar : null}
        </div>
      </div>
    </main>
  );
}
