import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/data/users";
import { createSession, setSessionCookie } from "@/lib/auth/session";

type LoginPayload = {
  email?: string;
  password?: string;
  redirectTo?: string;
  tenantSlug?: string;
  allowedRole?: "SUPER_ADMIN" | "TENANT_ADMIN" | "STAFF" | "CUSTOMER";
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contrasena son obligatorios." },
        { status: 400 },
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Las credenciales no son validas." },
        { status: 401 },
      );
    }

    if (payload.allowedRole === "SUPER_ADMIN" && user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Este acceso es exclusivo para super administradores." },
        { status: 403 },
      );
    }

    if (
      payload.allowedRole &&
      payload.allowedRole !== "SUPER_ADMIN" &&
      payload.allowedRole !== "CUSTOMER"
    ) {
      const hasMembership = user.memberships.some((membership) => {
        if (payload.tenantSlug && membership.tenant.slug !== payload.tenantSlug) {
          return false;
        }

        return membership.role === payload.allowedRole || membership.role === "TENANT_ADMIN";
      });

      if (!hasMembership && user.globalRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "No tienes permisos sobre este panel." },
          { status: 403 },
        );
      }
    }

    if (payload.allowedRole === "CUSTOMER" && user.globalRole !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Este acceso es solo para clientes finales." },
        { status: 403 },
      );
    }

    if (payload.allowedRole === "CUSTOMER" && payload.tenantSlug) {
      const hasCustomerProfile = user.customerProfiles.some(
        (profile) => profile.tenant.slug === payload.tenantSlug,
      );

      if (!hasCustomerProfile) {
        return NextResponse.json(
          { error: "No existe un perfil de cliente asociado a este tenant." },
          { status: 403 },
        );
      }
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      redirectTo: payload.redirectTo ?? "/",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar sesion en este momento." },
      { status: 500 },
    );
  }
}
