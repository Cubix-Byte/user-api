import { createRouteAccessMiddleware, sendErrorResponse } from '../utils/shared-lib-imports';
import { jwtHelper } from './auth.config';
import { routeAccessConfig } from './route-access.config';
import { ROUTES } from '../utils/constants/routes';
import User from '../models/user.schema';
import Tenant from '../models/tenant.schema';

/**
 * Check if tenant's trial period has expired
 */
const checkTrialExpiry = async (tenantId: string) => {
  try {
    const tenant = await Tenant.findById(tenantId)
      .select('isTrial trialEndDate')
      .lean();
    
    if (!tenant) return { expired: false };
    
    if (tenant.isTrial && tenant.trialEndDate) {
      const now = new Date();
      const endDate = new Date(tenant.trialEndDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return { 
        expired: now > endDate,
        daysLeft: daysLeft > 0 ? daysLeft : 0
      };
    }
    
    return { expired: false };
  } catch (error) {
    console.error('Error checking trial expiry:', error);
    return { expired: false };
  }
};

/**
 * Global Route Access Middleware Configuration
 * 
 * This middleware automatically handles authentication and authorization
 * for all routes based on the routeAccessConfig.
 * 
 * No need to add authenticateJWT or authorizeRoles to individual routes!
 */
export const globalAuthMiddleware = createRouteAccessMiddleware({
  routeAccessMap: routeAccessConfig,
  jwtHelper,
  internalApiKey: process.env.INTERNAL_API_KEY || 'your-internal-api-key-here',
  sendErrorResponse,
  
  // Optional: Fetch full user details (for additional validation)
  getUserById: async (userId: string) => {
    return await User.findById(userId)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          model: 'Permission',
        },
      })
      .select('+refreshToken');
  },
  
  // Optional: Extract role from user object
  extractUserRole: (user: any) => {
    return user?.role?.name || user?.roleName;
  },
  
  // Extract additional user data (tenantId from user object)
  extractUserData: async (user: any, decoded: any) => {
    // Priority 1: Get tenantId from user object (users table has tenantId field)
    const tenantId = user?.tenantId 
      ? (typeof user.tenantId === 'string' ? user.tenantId : user.tenantId.toString())
      : (decoded?.tenantId 
          ? (typeof decoded.tenantId === 'string' ? decoded.tenantId : decoded.tenantId.toString())
          : undefined);

    const tenantName = user?.tenantName || decoded?.tenantName;
    
    // Check trial expiry (skip for SuperAdmin role)
    const userRole = user?.role?.name || user?.roleName || decoded?.roleName;
    if (tenantId && userRole !== 'SuperAdmin') {
      const trialCheck = await checkTrialExpiry(tenantId);
      if (trialCheck.expired) {
        return {
          tenantId,
          tenantName,
          __trialExpired: true,
        };
      }
    }

    return {
      tenantId: tenantId,
      tenantName: tenantName,
    };
  },
  
  // Default access level for routes not in config (PRIVATE = requires auth)
  defaultAccess: undefined // Will use PRIVATE as default from middleware
});

// Validation middleware to check trial expiry
const trialValidationMiddleware = (req: any, res: any, next: any) => {
  // Check if trial has expired
  if (req.user?.__trialExpired) {
    return sendErrorResponse(
      res,
      'Trial period has expired. Please upgrade your subscription to continue.',
      403,
      { errorCode: 'TRIAL_EXPIRED', action: 'UPGRADE_REQUIRED' }
    );
  }
  next();
};

// Export combined middleware
export const enhancedGlobalAuthMiddleware = [globalAuthMiddleware, trialValidationMiddleware];

// Debug: Log route access config for unified login
console.log('Updated Route Access Config for unified login:');
console.log('Login route key:', `POST ${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.LOGIN}`);
console.log('Login config:', routeAccessConfig[`POST ${ROUTES.BASE}${ROUTES.AUTH.BASE}${ROUTES.AUTH.SUBROUTES.LOGIN}`]);

// Debug middleware to log incoming requests
export const debugMiddleware = (req: any, res: any, next: any) => {
  if (req.path.includes('login')) {
    console.log('=== DEBUG MIDDLEWARE ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Route key:', `${req.method.toUpperCase()} ${req.path}`);
    console.log('Route config exists:', !!routeAccessConfig[`${req.method.toUpperCase()} ${req.path}`]);
    console.log('Route config:', routeAccessConfig[`${req.method.toUpperCase()} ${req.path}`]);
    console.log('=======================');
  }
  next();
};


