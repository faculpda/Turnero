import { notFound } from "next/navigation";
import { TenantBookingPage } from "@/components/tenant/booking-page";
import { getCurrentSession, hasCustomerAccess } from "@/lib/auth/session";
import { getTenantBookingData } from "@/lib/data/tenants";

type BookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const bookingData = await getTenantBookingData(slug);
  const session = await getCurrentSession();

  if (!bookingData) {
    notFound();
  }

  const customerSession =
    session && (await hasCustomerAccess(slug)) ? session : null;

  return (
    <TenantBookingPage
      availabilityByService={bookingData.availabilityByService}
      customerSession={customerSession}
      tenant={bookingData.profile}
    />
  );
}
