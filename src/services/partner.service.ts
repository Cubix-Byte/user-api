import * as partnerRepository from "../repositories/partner.repository";
import * as tenantRepository from "../repositories/tenant.repository";
import { IPartner } from "../types/partner.types";
import { defaultPageLimit } from "shared-lib";
import { mergePermissionsWithDefaults } from "../utils/constants/permission-types";

// Partner service - contains business logic for Partner management

export const createPartner = async (data: Partial<IPartner>) => {
  return await partnerRepository.createPartner(data);
};

export const getPartnerById = async (id: string) => {
  const partner = await partnerRepository.findPartnerById(id);
  if (!partner) {
    throw new Error("PARTNER_NOT_FOUND");
  }
  return partner;
};

export const updatePartner = async (id: string, data: Partial<IPartner>) => {
  const partner = await partnerRepository.updatePartnerById(id, data);
  if (!partner) {
    throw new Error("PARTNER_NOT_FOUND");
  }
  return partner;
};

export const deletePartner = async (id: string) => {
  const partner = await partnerRepository.deletePartnerById(id);
  if (!partner) {
    throw new Error("PARTNER_NOT_FOUND");
  }
  return partner;
};

export const getAllPartners = async (params: {
  pageNo?: number;
  pageSize?: number;
  query?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
}) => {
  const pageSize = params.pageSize || defaultPageLimit;
  const pageNo = params.pageNo || 1;

  const partners = await partnerRepository.findPartners({
    pageNo: pageNo,
    pageSize: pageSize,
    query: params.query,
    sort: params.sort,
  });

  // Add tenant count to each partner
  const partnersWithTenantCount = await Promise.all(
    partners.map(async (partner) => {
      const tenantCount = await tenantRepository.countTenantsByPartnerId(
        partner.id || partner._id.toString()
      );
      return {
        ...partner,
        tenantCount,
      };
    })
  );

  const total = await partnerRepository.countPartners(params.query);

  return {
    partners: partnersWithTenantCount,
    pagination: {
      total,
      pageNo,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

export const setDefaultPartner = async (id: string) => {
  // First check if the partner exists (including inactive ones)
  const partner = await partnerRepository.findPartnerByIdWithoutActiveFilter(
    id
  );
  if (!partner) {
    throw new Error("PARTNER_NOT_FOUND");
  }

  // Set this partner as default (this will automatically unset others)
  const updatedPartner = await partnerRepository.setDefaultPartner(id);
  if (!updatedPartner) {
    throw new Error("PARTNER_NOT_FOUND");
  }

  return updatedPartner;
};

// Get all tenants for a specific partner with support for filtering and sorting
export const getPartnerTenants = async (
  partnerId: string,
  params: {
    pageNo?: number;
    pageSize?: number;
    query?: Record<string, any>;
    sort?: Record<string, 1 | -1>;
  }
) => {
  // Verify partner exists
  const partner = await partnerRepository.findPartnerById(partnerId);
  if (!partner) {
    throw new Error("PARTNER_NOT_FOUND");
  }

  const pageSize = params.pageSize || defaultPageLimit;
  const pageNo = params.pageNo || 1;

  const tenants = await tenantRepository.findTenantsByPartnerId(partnerId, {
    pageNo,
    pageSize,
    query: params.query,
    sort: params.sort,
  });

  // Merge permissions with defaults for each tenant - EXACT SAME AS tenant.service.ts
  const tenantsWithMergedPermissions = tenants.map((tenant: any) => {
    if (tenant.permissions) {
      tenant.permissions = mergePermissionsWithDefaults(tenant.permissions);
    } else {
      tenant.permissions = mergePermissionsWithDefaults([]);
    }
    return tenant;
  });

  const total = await tenantRepository.countTenantsByPartnerId(
    partnerId,
    params.query
  );

  return {
    tenants: tenantsWithMergedPermissions,
    pagination: {
      total,
      pageNo,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

// Get partner statistics (counts and total assigned tenants)
export const getPartnerStats = async () => {
  const partnerStatusStats = await partnerRepository.getPartnerStatusStats();
  const defaultPartner = await partnerRepository.findDefaultPartner();

  // Get all partners to calculate sum of their tenants
  // This ensures we only count tenants assigned to existing, non-deleted partners
  const allPartners = await partnerRepository.findPartners({
    pageSize: 1000000,
  });

  const tenantCounts = await Promise.all(
    allPartners.map((partner) =>
      tenantRepository.countTenantsByPartnerId(
        partner.id || partner._id.toString()
      )
    )
  );

  const totalAssignedTenants = tenantCounts.reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    partners: partnerStatusStats,
    totalAssignedTenants,
    defaultPartnerName: defaultPartner ? defaultPartner.companyName : null,
  };
};
