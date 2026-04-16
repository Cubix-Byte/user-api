import { Router } from "express";
import * as userController from "../controllers/v1/user.controller";
import { ROUTES } from "../utils/constants/routes";

// User routes - authentication and authorization handled by global middleware
const router = Router();

// Get all users with pagination and filters
router.route(ROUTES.USERS.SUBROUTES.ROOT).get(userController.getAllUsers);

// Get user statistics
router.route(ROUTES.USERS.SUBROUTES.STATS).get(userController.getUserStats);

// User by ID operations
router
  .route(ROUTES.USERS.SUBROUTES.ID)
  .get(userController.getUserById)
  .delete(userController.deleteUser);

// User status operations
router
  .route(ROUTES.USERS.SUBROUTES.STATUS)
  .patch(userController.toggleUserStatus);

export default router;
