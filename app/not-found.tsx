import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">404</span>
        <h1>No encontramos ese espacio.</h1>
        <p className="muted">
          El tenant puede no existir o todavia no estar vinculado correctamente.
        </p>
        <Link className="button primary" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
