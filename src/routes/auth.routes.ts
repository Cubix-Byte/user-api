import { Router } from "express";
import * as authController from "../controllers/v1/auth.controller";
import forgetPasswordRoutes from "./forget-password.routes";
import { validate } from "../middlewares/validate.middleware";
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../utils/requestValidators/auth.validator";
import { ROUTES } from "../utils/constants/routes";

const router = Router();

// All routes use global authentication middleware - no manual auth middleware needed here
// Public routes (no authentication required)
router
  .route(ROUTES.AUTH.SUBROUTES.REGISTER)
  .post(validate(registerSchema), authController.register);

router
  .route(ROUTES.AUTH.SUBROUTES.LOGIN)
  .post(validate(loginSchema), authController.login);


router
  .route(ROUTES.AUTH.SUBROUTES.REFRESH)
  .post(validate(refreshTokenSchema), authController.refreshToken);

// Protected routes (authentication handled by global middleware)
router
  .route(ROUTES.AUTH.SUBROUTES.LOGOUT)
  .post(authController.logout);

router
  .route(ROUTES.AUTH.SUBROUTES.PROFILE)
  .get(authController.getProfile)
  .put(validate(updateProfileSchema), authController.updateProfile);

router
  .route(ROUTES.AUTH.SUBROUTES.CHANGE_PASSWORD)
  .post(
    validate(changePasswordSchema),
    authController.changePassword
  );

// Forget password routes (public)
router.use(
  ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.BASE,
  forgetPasswordRoutes
);

export default router;

