import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "turnero_session";
const SESSION_DURATION_DAYS = 14;

export type AuthSession = {
  userId: string;
  name: string;
  email: string;
  globalRole: "SUPER_ADMIN" | "TENANT_ADMIN" | "STAFF" | "CUSTOMER";
  memberships: Array<{
    tenantId: string;
    tenantSlug: string;
    role: "SUPER_ADMIN" | "TENANT_ADMIN" | "STAFF" | "CUSTOMER";
  }>;
  customerTenantSlugs: string[];
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      expiresAt,
      userId,
    },
  });

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getCurrentSession = cache(async (): Promise<AuthSession | null> => {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: {
        tokenHash: hashToken(token),
      },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                tenant: true,
              },
            },
            customerProfiles: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      globalRole: session.user.globalRole,
      memberships: session.user.memberships.map((membership) => ({
        tenantId: membership.tenantId,
        tenantSlug: membership.tenant.slug,
        role: membership.role,
      })),
      customerTenantSlugs: session.user.customerProfiles.map((profile) => profile.tenant.slug),
    };
  } catch {
    return null;
  }
});

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    });
  }

  await clearSessionCookie();
}

export async function hasTenantAccess(tenantSlug: string): Promise<boolean> {
  const session = await getCurrentSession();

  if (!session) {
    return false;
  }

  if (session.globalRole === "SUPER_ADMIN") {
    return true;
  }

  return session.memberships.some((membership) => membership.tenantSlug === tenantSlug);
}

export async function hasCustomerAccess(tenantSlug: string): Promise<boolean> {
  const session = await getCurrentSession();

  if (!session) {
    return false;
  }

  if (session.globalRole === "SUPER_ADMIN") {
    return true;
  }

  return session.customerTenantSlugs.includes(tenantSlug);
}
