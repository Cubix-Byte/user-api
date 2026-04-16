import { Request, Response, NextFunction } from "express";
import {
  sendSuccessResponse,
  sendErrorResponse,
  HttpStatusCodes as SERVER_STATUS_CODES,
  buildQueryFromRequest,
} from "../../utils/shared-lib-imports";
import * as partnerService from "../../services/partner.service";
import { defaultPageLimit } from "shared-lib";

// Partner controller - handles all partner related HTTP requests

export const createPartner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const partner = await partnerService.createPartner(req.body);
    return sendSuccessResponse(res, "Partner created successfully", partner);
  } catch (error) {
    const errorMessage = (error as Error).message;

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
    console.error("Create partner error:", error);
    return sendErrorResponse(
      res,
      "Failed to create partner",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const getPartner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const partner = await partnerService.getPartnerById(req.params.id);
    return sendSuccessResponse(res, "Partner retrieved successfully", partner);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "PARTNER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Partner not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    console.error("Get partner error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve partner",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAllPartners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pageNo = Number(req.query.pageNo) || 1;
    const pageSize = Number(req.query.pageSize) || defaultPageLimit;

    const queryResult = buildQueryFromRequest(req, res);
    if (!queryResult) return;

    const { query, sort } = queryResult;

    const result = await partnerService.getAllPartners({
      pageNo,
      pageSize,
      query,
      sort,
    });
    return sendSuccessResponse(res, "Partners retrieved successfully", result);
  } catch (error) {
    console.error("Get all partners error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve partners",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const updatePartner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const partner = await partnerService.updatePartner(req.params.id, req.body);
    return sendSuccessResponse(res, "Partner updated successfully", partner);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "PARTNER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Partner not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

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
    console.error("Update partner error:", error);
    return sendErrorResponse(
      res,
      "Failed to update partner",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const deletePartner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await partnerService.deletePartner(req.params.id);
    return sendSuccessResponse(res, "Partner deleted successfully", {});
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "PARTNER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Partner not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    console.error("Delete partner error:", error);
    return sendErrorResponse(
      res,
      "Failed to delete partner",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const setDefaultPartner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const partner = await partnerService.setDefaultPartner(req.params.id);
    return sendSuccessResponse(
      res,
      "Partner set as default successfully",
      partner
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "PARTNER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Partner not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    console.error("Set default partner error:", error);
    return sendErrorResponse(
      res,
      "Failed to set default partner",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

export const getPartnerTenants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: partnerId } = req.params;
    // Extract pagination parameters - EXACTLY SAME AS tenant.controller.ts
    const pageNo = Number(req.query.pageNo) || defaultPageLimit;
    const pageSize = Number(req.query.pageSize) || defaultPageLimit;

    // Use standardized query builder to parse 'filter' and 'sort' from request
    const queryResult = buildQueryFromRequest(req, res);
    if (!queryResult) return;

    const { query, sort } = queryResult;

    const result = await partnerService.getPartnerTenants(partnerId, {
      pageNo,
      pageSize,
      query,
      sort,
    });

    return sendSuccessResponse(
      res,
      "Partner tenants retrieved successfully",
      result
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "PARTNER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Partner not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    console.error("Get partner tenants error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve partner tenants",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Get partner statistics
export const getPartnerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.getPartnerStats();
    return sendSuccessResponse(
      res,
      "Partner statistics retrieved successfully",
      result
    );
  } catch (error) {
    console.error("Get partner stats error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve partner statistics",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};
