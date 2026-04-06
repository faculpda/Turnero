import { tenantPublicProfile, tenants } from "@/lib/mock-data";
import type { TenantPublicProfile, TenantSummary } from "@/lib/types";

export function getTenantBySlug(slug: string): TenantSummary | undefined {
  return tenants.find((tenant) => tenant.slug === slug);
}

export function getPublicTenantProfile(slug: string): TenantPublicProfile | undefined {
  if (slug === tenantPublicProfile.slug) {
    return tenantPublicProfile;
  }

  return undefined;
}
