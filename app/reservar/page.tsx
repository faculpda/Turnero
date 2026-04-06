import { notFound } from "next/navigation";
import { TenantBookingPage } from "@/components/tenant/booking-page";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { getTenantBookingDataByHost } from "@/lib/data/tenants";
import { getRequestHost, isPlatformHost } from "@/lib/tenant-context";

export default async function RootBookingPage() {
  const host = await getRequestHost();

  if (!host || isPlatformHost(host)) {
    notFound();
  }

  const bookingData = await getTenantBookingDataByHost(host);

  if (!bookingData) {
    notFound();
  }

  const session = await getCurrentSession();
  const customerSession =
    session && (await hasCustomerAccess(bookingData.profile.slug)) ? session : null;

  return (
    <TenantBookingPage
      availabilityByService={bookingData.availabilityByService}
      customerSession={customerSession}
      tenant={bookingData.profile}
      useSlugRoutes={false}
    />
  );
}
