import {
  RouteAccessLevel,
  RouteAccessMap,
  routeKey,
} from "../utils/shared-lib-imports";
import { ROUTES } from "../utils/constants/routes";
import { ROLE_NAMES } from "../utils/shared-lib-imports";

/**
 * Route Access Configuration for User API
 *
 * This configuration defines access levels for all routes in the application.
 * The global route access middleware will automatically handle authentication
 * based on these settings.
 *
 * Access Levels:
 * - PUBLIC: No authentication required
 * - PRIVATE: Authentication required (any logged-in user)
 * - ADMIN: Admin role required
 * - ROLE_BASED: Specific role(s) required (defined in roles array)
 * - INTERNAL: Internal microservice API key required
 */
export const routeAccessConfig: RouteAccessMap = {
  // ============================================
  // HEALTH CHECK ROUTES (PUBLIC)
  // ============================================
  [routeKey("GET", "/health")]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  [routeKey("GET", "/debug")]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  [routeKey("GET", `${ROUTES.BASE}${ROUTES.HEALTH.BASE}`)]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================
  // Registration and login are public
  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.REGISTER}`
  )]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.LOGIN}`
  )]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  // Refresh token is public (requires refresh token in body)
  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.REFRESH}`
  )]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  // Profile and password management require authentication
  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.PROFILE}`
  )]: {
    level: RouteAccessLevel.PRIVATE,
    active: true,
  },

  [routeKey(
    "PUT",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.PROFILE}`
  )]: {
    level: RouteAccessLevel.PRIVATE,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.CHANGE_PASSWORD}`
  )]: {
    level: RouteAccessLevel.PRIVATE,
    active: true,
  },

  // ============================================
  // FORGET PASSWORD ROUTES (PUBLIC)
  // ============================================
  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.BASE}${ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.SEND_VERIFICATION}`
  )]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.BASE}${ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.VERIFY}`
  )]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.BASE}${ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.UPDATE_PASSWORD}`
  )]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.LOGOUT}`
  )]: {
    level: RouteAccessLevel.PRIVATE,
    active: true,
  },

  // ============================================
  // TENANT ROUTES (ADMIN ONLY)
  // ============================================
  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.ROOT}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.ROOT}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.ID}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "PUT",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.ID}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "DELETE",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.ID}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  // Get tenant by name (Public - no authentication required)
  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.NAME}`
  )]: {
    level: RouteAccessLevel.PUBLIC,
    active: true,
  },

  // Dashboard metrics routes (Admin only)
  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.DASHBOARD_METRICS}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.TENANTS.BASE}${ROUTES.TENANTS.SUBROUTES.STATUS_STATS}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  // ============================================
  // PARTNER ROUTES (ADMIN ONLY)
  // ============================================
  [routeKey(
    "POST",
    `${ROUTES.BASE}${ROUTES.PARTNERS.BASE}${ROUTES.PARTNERS.SUBROUTES.ROOT}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.PARTNERS.BASE}${ROUTES.PARTNERS.SUBROUTES.ROOT}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.BASE}${ROUTES.PARTNERS.BASE}${ROUTES.PARTNERS.SUBROUTES.ID}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "PUT",
    `${ROUTES.BASE}${ROUTES.PARTNERS.BASE}${ROUTES.PARTNERS.SUBROUTES.ID}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  [routeKey(
    "DELETE",
    `${ROUTES.BASE}${ROUTES.PARTNERS.BASE}${ROUTES.PARTNERS.SUBROUTES.ID}`
  )]: {
    level: RouteAccessLevel.ADMIN,
    active: true,
  },

  // ============================================
  // INTERNAL API ROUTES
  // ============================================
  [routeKey(
    "GET",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.HEALTH}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  // User management internal APIs
  [routeKey(
    "GET",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.VALIDATE_USER}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.CHECK_USER_EXISTS}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USER_BY_ID}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USERS_BY_IDS}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.CREATE_USER}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "PUT",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.UPDATE_USER}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "DELETE",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.DELETE_USER}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  // Role and permission internal APIs
  [routeKey(
    "GET",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USER_ROLE}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "GET",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_USER_PERMISSIONS}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.VALIDATE_PERMISSION}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  // Tenant internal APIs
  [routeKey(
    "GET",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.GET_TENANT_BY_ID}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.VALIDATE_TENANT}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  // Bulk operations
  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.BULK_CREATE_USERS}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.BULK_UPDATE_USERS}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  // Data sync endpoints
  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.SYNC_USER_DATA}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },

  [routeKey(
    "POST",
    `${ROUTES.INTERNAL}${ROUTES.INTERNAL_ROUTES.SUBROUTES.SYNC_TENANT_DATA}`
  )]: {
    level: RouteAccessLevel.INTERNAL,
    active: true,
  },
};
