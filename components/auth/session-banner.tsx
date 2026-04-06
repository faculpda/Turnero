import { LogoutButton } from "@/components/auth/logout-button";
import type { AuthSession } from "@/lib/auth/session";

type SessionBannerProps = {
  session: AuthSession;
  subtitle: string;
};

export function SessionBanner({ session, subtitle }: SessionBannerProps) {
  return (
    <div className="session-banner">
      <div>
        <strong>{session.name}</strong>
        <div className="muted">{session.email}</div>
      </div>
      <div className="actions">
        <span className="badge active">{session.globalRole}</span>
        <span className="muted">{subtitle}</span>
        <LogoutButton />
      </div>
    </div>
  );
}
