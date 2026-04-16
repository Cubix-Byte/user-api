// User API specific route constants following /user-api/api/v1/endpoint pattern
// Each service manages its own API routes independently
// Version can be easily changed from v1 to v2, v3, etc.

export const ROUTES = {
  SERVICE_BASE: "/user", // Service base path
  API_BASE: "/api", // API base path
  INTERNAL_BASE: "/internal", // Internal API base path
  VERSION: "v1", // API version (can be changed to v2, v3, etc.)

  // Complete base path for current version
  get BASE() {
    return `${this.SERVICE_BASE}${this.API_BASE}/${this.VERSION}`;
  },

  // Internal API base path (no versioning needed for internal APIs)
  get INTERNAL() {
    return `${this.SERVICE_BASE}${this.INTERNAL_BASE}`;
  },

  AUTH: {
    BASE: "/auth", // Authentication routes
    SUBROUTES: {
      REGISTER: "/register",
      LOGIN: "/login",
      REFRESH: "/refresh",
      LOGOUT: "/logout",
      PROFILE: "/profile",
      CHANGE_PASSWORD: "/change-password",
      FORGET_PASSWORD: {
        BASE: "/forget-password",
        SEND_VERIFICATION: "/send-verification",
        VERIFY: "/verify",
        UPDATE_PASSWORD: "/update-password",
      },
    },
  },

  TENANTS: {
    BASE: "/tenants", // Tenant (school) management routes
    SUBROUTES: {
      ROOT: "/",
      ID: "/:id",
      NAME: "/by-name/:tenantName",
      DASHBOARD_METRICS: "/dashboard/metrics",
      STATUS_STATS: "/status/stats",
    },
  },

  PARTNERS: {
    BASE: "/partners", // Partner management routes
    SUBROUTES: {
      ROOT: "/",
      ID: "/:id",
      STATS: "/stats",
    },
  },

  USERS: {
    BASE: "/users", // User management routes
    SUBROUTES: {
      ROOT: "/",
      ID: "/:id",
      STATUS: "/:id/status",
      STATS: "/stats",
    },
  },

  HEALTH: {
    BASE: "/health", // Health check routes
  },

  // Internal API routes (for microservice-to-microservice communication)
  INTERNAL_ROUTES: {
    BASE: "/internal", // Internal API base
    SUBROUTES: {
      // User validation endpoints
      VALIDATE_USER: "/validate-user",
      CHECK_USER_EXISTS: "/check-user-exists",
      CHECK_EXISTING_EMAILS: "/check-existing-emails",
      GET_USER_BY_ID: "/user/:id",
      GET_USERS_BY_IDS: "/users/batch",

      // User management endpoints (for academy-api)
      CREATE_USER: "/user/create",
      UPDATE_USER: "/user/:id/update",
      DELETE_USER: "/user/:id/delete",

      // Role and permission endpoints
      GET_USER_ROLE: "/user/:id/role",
      GET_USER_PERMISSIONS: "/user/:id/permissions",
      VALIDATE_PERMISSION: "/validate-permission",

      // Tenant endpoints
      GET_TENANT_BY_ID: "/tenant/:id",
      VALIDATE_TENANT: "/validate-tenant",

      // Health check for internal services
      HEALTH: "/health",

      // Bulk operations
      BULK_CREATE_USERS: "/users/bulk-create",
      BULK_UPDATE_USERS: "/users/bulk-update",

      // Data sync endpoints
      SYNC_USER_DATA: "/sync/user-data",
      SYNC_TENANT_DATA: "/sync/tenant-data",
    },
  },
} as const;
