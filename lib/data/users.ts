import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
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
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}
