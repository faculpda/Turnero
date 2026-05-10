"use client";

import { useEffect, useMemo, useState } from "react";

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalAppointments: number;
  activeAppointments: number;
  pendingPayments: number;
  lastServiceName?: string;
  nextAppointment?: string;
  history: Array<{
    id: string;
    serviceName: string;
    startsAt: string;
    status: string;
    paymentStatus: string;
  }>;
};

type CustomersPanelProps = {
  customers: CustomerSummary[];
};

function paymentLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "Pago aprobado";
    case "PENDING":
      return "Pago pendiente";
    case "NOT_REQUIRED":
      return "Sin cobro";
    case "CANCELLED":
      return "Pago cancelado";
    case "REJECTED":
      return "Pago rechazado";
    default:
      return status;
  }
}

function appointmentStatusLabel(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmado";
    case "PENDING":
      return "Pendiente";
    case "COMPLETED":
      return "Completado";
    case "CANCELLED":
      return "Cancelado";
    case "NO_SHOW":
      return "No asistio";
    default:
      return status;
  }
}

export function CustomersPanel({ customers }: CustomersPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [showCustomerDetail, setShowCustomerDetail] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 640) {
      setShowCustomerDetail(false);
    }
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone ?? ""].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [customers, query]);

  const selectedCustomer =
    filteredCustomers.find((customer) => customer.id === selectedCustomerId) ??
    filteredCustomers[0] ??
    null;

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h2>Clientes</h2>
          <p className="muted">
            Revisa historial, proximos turnos y cobros pendientes por cada persona.
          </p>
        </div>
      </div>

      <section className="dashboard-split-grid">
        <article className="panel dashboard-main-card dashboard-hierarchy-shell">
          <div className="dashboard-section-header">
            <div>
              <h2>Base de clientes</h2>
              <p className="muted">Busca por nombre, mail o telefono para encontrar rapido a cada cliente.</p>
            </div>
          </div>

          <div className="dashboard-hierarchy-subpanel dashboard-block-form">
            <input
              className="dashboard-modal-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente por nombre, mail o telefono"
              value={query}
            />
          </div>

          <div className="dashboard-block-list">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  className={`dashboard-customer-item dashboard-hierarchy-item ${
                    selectedCustomer?.id === customer.id ? "is-active" : ""
                  }`}
                  key={customer.id}
                >
                  <button
                    className="dashboard-customer-item-main"
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setShowCustomerDetail(true);
                    }}
                    type="button"
                  >
                    <div>
                      <strong>{customer.name}</strong>
                      <div className="muted">{customer.email}</div>
                      {customer.phone ? <div className="muted">{customer.phone}</div> : null}
                    </div>
                    <div className="dashboard-customer-item-metrics">
                      <span className="badge pending">{customer.totalAppointments} turnos</span>
                      {customer.pendingPayments > 0 ? (
                        <span className="badge cancelled">
                          {customer.pendingPayments} pagos pendientes
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <div className="dashboard-customer-item-actions">
                    <button
                      className="button secondary"
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setShowCustomerDetail((current) =>
                          selectedCustomer?.id === customer.id ? !current : true,
                        );
                      }}
                      type="button"
                    >
                      {selectedCustomer?.id === customer.id && showCustomerDetail
                        ? "Ocultar ficha"
                        : "Ver ficha"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-calendar-empty">
                No hay clientes que coincidan con la busqueda actual.
              </div>
            )}
          </div>
        </article>

        <article className="panel dashboard-side-card dashboard-hierarchy-shell dashboard-hierarchy-shell-soft">
          <div className="dashboard-section-header">
            <div>
              <h2>Ficha del cliente</h2>
              <p className="muted">Resumen rapido para atender mejor y con mas contexto.</p>
            </div>
          </div>

          {selectedCustomer && showCustomerDetail ? (
            <div className="dashboard-block-list">
              <div className="dashboard-hierarchy-subpanel dashboard-block-form">
                <strong>{selectedCustomer.name}</strong>
                <div className="muted">{selectedCustomer.email}</div>
                {selectedCustomer.phone ? <div className="muted">{selectedCustomer.phone}</div> : null}
              </div>

              <div className="dashboard-detail-list dashboard-hierarchy-subpanel">
                <div className="dashboard-detail-row">
                  <span>Total de turnos</span>
                  <strong>{selectedCustomer.totalAppointments}</strong>
                </div>
                <div className="dashboard-detail-row">
                  <span>Turnos activos</span>
                  <strong>{selectedCustomer.activeAppointments}</strong>
                </div>
                <div className="dashboard-detail-row">
                  <span>Pagos pendientes</span>
                  <strong>{selectedCustomer.pendingPayments}</strong>
                </div>
                <div className="dashboard-detail-row">
                  <span>Ultimo servicio</span>
                  <strong>{selectedCustomer.lastServiceName ?? "Sin datos"}</strong>
                </div>
                <div className="dashboard-detail-row">
                  <span>Proximo turno</span>
                  <strong>{selectedCustomer.nextAppointment ?? "Sin proximo turno"}</strong>
                </div>
              </div>

              <div className="dashboard-block-list dashboard-hierarchy-subpanel">
                <strong>Historial reciente</strong>
                {selectedCustomer.history.map((appointment) => (
                  <div className="dashboard-customer-history-item" key={appointment.id}>
                    <div>
                      <strong>{appointment.serviceName}</strong>
                      <div className="muted">{appointment.startsAt}</div>
                    </div>
                    <div className="dashboard-customer-history-meta">
                      <span className="badge pending">
                        {appointmentStatusLabel(appointment.status)}
                      </span>
                      <span className="badge approved">
                        {paymentLabel(appointment.paymentStatus)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedCustomer ? (
            <div className="dashboard-calendar-empty">
              Toca en <strong>Ver ficha</strong> para abrir el detalle de este cliente.
            </div>
          ) : (
            <div className="dashboard-calendar-empty">
              Todavia no hay clientes con historial disponible.
            </div>
          )}
        </article>
      </section>
    </section>
  );
}
