import { Router } from "express";
import * as forgetPasswordController from "../controllers/v1/forget-password.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  sendVerificationEmailSchema,
  verifyEmailSchema,
  updatePasswordSchema,
} from "../utils/requestValidators/forget-password.validator";
import { ROUTES } from "../utils/constants/routes";

const router = Router();

// All forget password routes are PUBLIC (no authentication required)

/**
 * Send Verification Email
 * POST /user/api/v1/auth/forget-password/send-verification
 */
router
  .route(ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.SEND_VERIFICATION)
  .post(
    validate(sendVerificationEmailSchema),
    forgetPasswordController.sendVerificationEmail
  );

/**
 * Verify Email OTP
 * POST /user/api/v1/auth/forget-password/verify
 */
router
  .route(ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.VERIFY)
  .post(validate(verifyEmailSchema), forgetPasswordController.verifyEmail);

/**
 * Update Password
 * POST /user/api/v1/auth/forget-password/update-password
 */
router
  .route(ROUTES.AUTH.SUBROUTES.FORGET_PASSWORD.UPDATE_PASSWORD)
  .post(
    validate(updatePasswordSchema),
    forgetPasswordController.updatePassword
  );

export default router;

