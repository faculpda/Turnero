import Link from "next/link";
import { tenants } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <main className="shell grid">
      <section className="hero">
        <div className="header-row">
          <div>
            <span className="eyebrow">Super admin</span>
            <h1>Control central del SaaS</h1>
            <p className="muted">
              Aqui vas a ver el estado de cada cliente y tambien vas a poder entrar
              a su panel para ayudarlo con la configuracion.
            </p>
          </div>
          <Link className="button primary" href="/">
            Volver al inicio
          </Link>
        </div>
      </section>

      <section className="grid cols-3">
        <article className="metric">
          <h2>{tenants.length}</h2>
          <p className="muted">Tenants registrados</p>
        </article>
        <article className="metric">
          <h2>{tenants.filter((tenant) => tenant.status === "ACTIVE").length}</h2>
          <p className="muted">Tenants activos</p>
        </article>
        <article className="metric">
          <h2>{tenants.reduce((sum, tenant) => sum + tenant.upcomingAppointments, 0)}</h2>
          <p className="muted">Turnos proximos</p>
        </article>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>URL</th>
              <th>Estado</th>
              <th>Turnos</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <strong>{tenant.name}</strong>
                  <div className="muted">/{tenant.slug}</div>
                </td>
                <td>{tenant.domain ?? `turnero.com.ar/${tenant.slug}`}</td>
                <td>
                  <span className={`badge ${tenant.status.toLowerCase()}`}>
                    {tenant.status}
                  </span>
                </td>
                <td>{tenant.upcomingAppointments}</td>
                <td>
                  <Link className="button secondary" href="/app">
                    Entrar al panel
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
