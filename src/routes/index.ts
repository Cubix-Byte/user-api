import { Router } from "express";
import authRoutes from "./auth.routes";
import tenantRoutes from "./tenant.routes";
import partnerRoutes from "./partner.routes";
import userRoutes from "./user.routes";
import { ROUTES } from "../utils/constants/routes";

// Main router - combines all route modules
const router = Router();

// Health check endpoint
router.get(ROUTES.HEALTH.BASE, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User API is running",
    timestamp: new Date().toISOString(),
    service: "user-api",
  });
});

// Authentication routes (public)
router.use(ROUTES.AUTH.BASE, authRoutes);

// Protected routes
router.use(ROUTES.TENANTS.BASE, tenantRoutes);
router.use(ROUTES.PARTNERS.BASE, partnerRoutes);
router.use(ROUTES.USERS.BASE, userRoutes);

export default router;
