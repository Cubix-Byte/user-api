import { Router } from "express";
import * as tenantController from "../controllers/v1/tenant.controller";
import { validate } from "../middlewares/validate.middleware";
import { ROUTES } from "../utils/constants/routes";
import {
  createTenantSchema,
  updateTenantSchema,
  getTenantSchema,
  deleteTenantSchema
} from "../utils/requestValidators/tenant.validator";

// Tenant routes - authentication and authorization handled by global middleware
const router = Router();

// CRUD operations for tenants (schools)
router
  .route(ROUTES.TENANTS.SUBROUTES.ROOT)
  .post(validate(createTenantSchema), tenantController.createTenant) // Create new tenant
  .get(tenantController.getAllTenants); // Get all tenants

// Individual tenant operations
router
  .route(ROUTES.TENANTS.SUBROUTES.ID)
  .get(validate(getTenantSchema), tenantController.getTenant) // Get single tenant
  .put(validate(updateTenantSchema), tenantController.updateTenant) // Update tenant
  .delete(validate(deleteTenantSchema), tenantController.deleteTenant); // Delete tenant

// Get tenant by tenantName
router
  .route(ROUTES.TENANTS.SUBROUTES.NAME)
  .get(tenantController.getTenantByName); // Get tenant by tenantName

// Dashboard metrics routes
router
  .route(ROUTES.TENANTS.SUBROUTES.DASHBOARD_METRICS)
  .get(tenantController.getTenantDashboardMetrics); // Get dashboard metrics

router
  .route(ROUTES.TENANTS.SUBROUTES.STATUS_STATS)
  .get(tenantController.getTenantStatusStats); // Get tenant status statistics

export default router;

