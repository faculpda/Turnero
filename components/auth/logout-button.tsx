"use client";

import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  redirectTo?: string;
};

export function LogoutButton({ redirectTo = "/" }: LogoutButtonProps) {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button className="button secondary" onClick={onClick} type="button">
      Cerrar sesion
    </button>
  );
}
