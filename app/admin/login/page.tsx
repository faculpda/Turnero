import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <main className="shell">
      <LoginForm
        allowedRole="SUPER_ADMIN"
        defaultEmail="admin@turnero.com"
        description="Acceso para el dueño del SaaS y operadores con vision global del sistema."
        redirectTo="/admin"
        title="Ingresar como super admin"
      />
    </main>
  );
}
