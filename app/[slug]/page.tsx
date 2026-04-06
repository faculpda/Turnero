import { notFound } from "next/navigation";
import { TenantPublicHome } from "@/components/tenant/public-home";
import { getPublicTenantProfile } from "@/lib/data/tenants";

type TenantPublicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TenantPublicPage({ params }: TenantPublicPageProps) {
  const { slug } = await params;
  const tenant = await getPublicTenantProfile(slug);

  if (!tenant) {
    notFound();
  }

  return <TenantPublicHome tenant={tenant} />;
}
