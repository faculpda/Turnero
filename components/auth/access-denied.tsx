import Link from "next/link";

type AccessDeniedProps = {
  title: string;
  description: string;
  loginHref: string;
};

export function AccessDenied({ title, description, loginHref }: AccessDeniedProps) {
  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">Acceso restringido</span>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
        <div className="actions">
          <Link className="button primary" href={loginHref}>
            Iniciar sesion
          </Link>
          <Link className="button secondary" href="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
