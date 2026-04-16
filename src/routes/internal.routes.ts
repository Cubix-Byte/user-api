import { Router } from "express";
import { ROUTES } from "../utils/constants/routes";
import * as internalController from "../controllers/v1/internal.controller";

// Internal routes for microservice-to-microservice communication
// These routes are not versioned and are used for internal service communication
const router = Router();

// Internal health check
router.get(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.HEALTH,
  internalController.internalHealthCheck
);

// User management internal APIs
// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
router.get(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.VALIDATE_USER,
  internalController.validateUser
);
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.VALIDATE_USER,
  internalController.validateUser
);
router.get(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.CHECK_USER_EXISTS,
  internalController.checkUserExists
);
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.CHECK_EXISTING_EMAILS,
  internalController.checkExistingEmails
);
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USERS_BY_IDS,
  internalController.getUsersByIds
);

// User creation internal APIs (for academy-api to create users)
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.CREATE_USER,
  internalController.createUser
);

// Role and permission internal APIs
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.VALIDATE_PERMISSION,
  internalController.validatePermission
);

// Parameterized routes MUST come AFTER specific routes to avoid conflicts
router.get(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USER_BY_ID,
  internalController.getUserById
);
router.put(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.UPDATE_USER,
  internalController.updateUser
);
router.delete(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.DELETE_USER,
  internalController.deleteUser
);
router.get(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USER_ROLE,
  internalController.getUserRole
);
router.get(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USER_PERMISSIONS,
  internalController.getUserPermissions
);

// Tenant internal APIs
router.get(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_TENANT_BY_ID,
  internalController.getTenantById
);
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.VALIDATE_TENANT,
  internalController.validateTenant
);

// Bulk operations
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.BULK_CREATE_USERS,
  internalController.bulkCreateUsers
);
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.BULK_UPDATE_USERS,
  internalController.bulkUpdateUsers
);

// Data sync endpoints
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.SYNC_USER_DATA,
  internalController.syncUserData
);
router.post(
  ROUTES.INTERNAL_ROUTES.SUBROUTES.SYNC_TENANT_DATA,
  internalController.syncTenantData
);

export default router;
