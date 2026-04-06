import { notFound } from "next/navigation";
import { TenantBookingPage } from "@/components/tenant/booking-page";
import { getPublicTenantProfileByHost } from "@/lib/data/tenants";
import { getRequestHost, isPlatformHost } from "@/lib/tenant-context";

export default async function RootBookingPage() {
  const host = await getRequestHost();

  if (!host || isPlatformHost(host)) {
    notFound();
  }

  const tenant = await getPublicTenantProfileByHost(host);

  if (!tenant) {
    notFound();
  }

  return <TenantBookingPage tenant={tenant} />;
}
