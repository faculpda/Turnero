import { notFound } from "next/navigation";
import { TenantPublicHome } from "@/components/tenant/public-home";
import { getTenantBookingData } from "@/lib/data/tenants";

type TenantPublicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TenantPublicPage({ params }: TenantPublicPageProps) {
  const { slug } = await params;
  const bookingData = await getTenantBookingData(slug);

  if (!bookingData) {
    notFound();
  }

  return (
    <TenantPublicHome
      availabilityByService={bookingData.availabilityByService}
      tenant={bookingData.profile}
    />
  );
}
