import { notFound } from "next/navigation";
import { TenantBookingPage } from "@/components/tenant/booking-page";
import { getPublicTenantProfile } from "@/lib/data/tenants";

type BookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const tenant = await getPublicTenantProfile(slug);

  if (!tenant) {
    notFound();
  }

  return <TenantBookingPage tenant={tenant} />;
}
