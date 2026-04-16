import { Request, Response, NextFunction } from "express";
import {
  sendSuccessResponse,
  sendErrorResponse,
  HttpStatusCodes as SERVER_STATUS_CODES,
  buildQueryFromRequest,
  ROLE_NAMES,
} from "../../utils/shared-lib-imports";
import * as tenantService from "../../services/tenant.service";
import { defaultPageLimit } from "shared-lib";

// Tenant controller - handles all tenant (school) related HTTP requests
// Create new tenant record
export const createTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    return sendSuccessResponse(res, "Tenant created successfully", tenant);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "SCHOOL_NAME_EXISTS") {
      return sendErrorResponse(
        res,
        "School name already exists",
        SERVER_STATUS_CODES.CONFLICT
      );
    }

    if (errorMessage === "TENANT_NAME_EXISTS") {
      return sendErrorResponse(
        res,
        "Tenant name already exists",
        SERVER_STATUS_CODES.CONFLICT
      );
    }

    if (errorMessage === "EMAIL_EXISTS") {
      return sendErrorResponse(
        res,
        "Admin email already exists",
        SERVER_STATUS_CODES.CONFLICT
      );
    }

    // Handle validation errors
    if ((error as any).name === "ValidationError") {
      const validationErrors = Object.values((error as any).errors)
        .map((err: any) => err.message)
        .join(", ");
      return sendErrorResponse(
        res,
        validationErrors,
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }
    console.error("Create tenant error:", error);
    return sendErrorResponse(
      res,
      "Failed to create tenant",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const getTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    return sendSuccessResponse(res, "Tenant retrieved successfully", tenant);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "TENANT_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Tenant not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    console.error("Get tenant error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve tenant",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const getTenantByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let tenantName = req.params.tenantName?.trim();
    const tenant = await tenantService.getTenantByName(tenantName);
    return sendSuccessResponse(res, "Tenant retrieved successfully", tenant);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "TENANT_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Tenant not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    console.error("Get tenant by name error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve tenant",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAllTenants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract pagination parameters - Took the Default Page limit from shared-lib - This was missing in class controller but was mention by Rao in meeting that we should use it
    const pageNo = Number(req.query.pageNo) || defaultPageLimit;
    const pageSize = Number(req.query.pageSize) || defaultPageLimit;

    // Build dynamic query and sort from filter parameter
    const queryResult = buildQueryFromRequest(req, res);
    if (!queryResult) return; // Error response already handled by buildQueryFromRequest

    console.log(queryResult);

    let { query, sort } = queryResult;

    console.log("Query check me out:", query);

    console.log("I am getting hit");
    // Pass query parameters to service
    const result = await tenantService.getAllTenants({
      pageNo,
      pageSize,
      query,
      sort,
    });
    return sendSuccessResponse(res, "Tenants retrieved successfully", result);
  } catch (error) {
    console.error("Get all tenants error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve tenants",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Disallow tenant Admins from modifying permissions
    const isTenantAdmin =
      req.user?.roleName === ROLE_NAMES.ADMIN || req.user?.userType === "admin";

    if (
      isTenantAdmin &&
      typeof (req.body as any)?.permissions !== "undefined"
    ) {
      return sendErrorResponse(
        res,
        "Tenant Admins are not allowed to modify permissions",
        SERVER_STATUS_CODES.FORBIDDEN
      );
    }

    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    return sendSuccessResponse(res, "Tenant updated successfully", tenant);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "TENANT_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Tenant not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    // Handle validation errors
    if ((error as any).name === "ValidationError") {
      const validationErrors = Object.values((error as any).errors)
        .map((err: any) => err.message)
        .join(", ");
      return sendErrorResponse(
        res,
        validationErrors,
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }
    console.error("Update tenant error:", error);
    return sendErrorResponse(
      res,
      "Failed to update tenant",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const deleteTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await tenantService.deleteTenant(req.params.id);
    return sendSuccessResponse(res, "Tenant deleted successfully", {});
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "TENANT_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Tenant not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    console.error("Delete tenant error:", error);
    return sendErrorResponse(
      res,
      "Failed to delete tenant",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Dashboard metrics controller
export const getTenantDashboardMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const metrics = await tenantService.getTenantDashboardMetrics();
    return sendSuccessResponse(
      res,
      "Dashboard metrics retrieved successfully",
      metrics
    );
  } catch (error) {
    console.error("Get dashboard metrics error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve dashboard metrics",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Tenant status statistics controller
export const getTenantStatusStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await tenantService.getTenantStatusStats();
    return sendSuccessResponse(
      res,
      "Tenant status statistics retrieved successfully",
      stats
    );
  } catch (error) {
    console.error("Get tenant status stats error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve tenant status statistics",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};
