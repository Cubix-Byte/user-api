import { Router } from "express";
import * as partnerController from "../controllers/v1/partner.controller";
import { validate } from "../middlewares/validate.middleware";
import { ROUTES } from "../utils/constants/routes";
import {
  createPartnerSchema,
  updatePartnerSchema,
  getPartnerSchema,
  deletePartnerSchema,
  setDefaultPartnerSchema,
} from "../utils/requestValidators/partner.validator";

const router = Router();

// CRUD operations for partners
router
  .route(ROUTES.PARTNERS.SUBROUTES.ROOT)
  .post(validate(createPartnerSchema), partnerController.createPartner)
  .get(partnerController.getAllPartners);

// Get partner statistics
router
  .route(ROUTES.PARTNERS.SUBROUTES.STATS)
  .get(partnerController.getPartnerStats);

// Individual partner operations
router
  .route(ROUTES.PARTNERS.SUBROUTES.ID)
  .get(validate(getPartnerSchema), partnerController.getPartner)
  .put(validate(updatePartnerSchema), partnerController.updatePartner)
  .delete(validate(deletePartnerSchema), partnerController.deletePartner);

// Set default partner
router
  .route(`${ROUTES.PARTNERS.SUBROUTES.ID}/set-default`)
  .patch(
    validate(setDefaultPartnerSchema),
    partnerController.setDefaultPartner
  );

// Get partner's tenants
router
  .route(`${ROUTES.PARTNERS.SUBROUTES.ID}/tenants`)
  .get(validate(getPartnerSchema), partnerController.getPartnerTenants);

export default router;
