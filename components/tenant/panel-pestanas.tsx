"use client";

import { useState } from "react";

type PanelPestanasProps = {
  resumen: React.ReactNode;
  servicios: React.ReactNode;
  personalizar: React.ReactNode;
};

type TabId = "resumen" | "servicios" | "personalizar";

export function PanelPestanas({
  resumen,
  servicios,
  personalizar,
}: PanelPestanasProps) {
  const [tabActiva, setTabActiva] = useState<TabId>("resumen");

  return (
    <section className="panel panel-pestanas">
      <div className="tabs-header" role="tablist" aria-label="Panel del tenant">
        <button
          aria-selected={tabActiva === "resumen"}
          className={`tab-button ${tabActiva === "resumen" ? "active" : ""}`}
          onClick={() => setTabActiva("resumen")}
          role="tab"
          type="button"
        >
          Resumen
        </button>
        <button
          aria-selected={tabActiva === "servicios"}
          className={`tab-button ${tabActiva === "servicios" ? "active" : ""}`}
          onClick={() => setTabActiva("servicios")}
          role="tab"
          type="button"
        >
          Servicios
        </button>
        <button
          aria-selected={tabActiva === "personalizar"}
          className={`tab-button ${tabActiva === "personalizar" ? "active" : ""}`}
          onClick={() => setTabActiva("personalizar")}
          role="tab"
          type="button"
        >
          Personalizar Pagina
        </button>
      </div>

      <div className="tab-content">
        {tabActiva === "resumen" ? resumen : null}
        {tabActiva === "servicios" ? servicios : null}
        {tabActiva === "personalizar" ? personalizar : null}
      </div>
    </section>
  );
}
