import express from "express";
import vendorRequestRoutes from "./vendorRequestRoutes.js";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { getVendorOpenings } from "../../controllers/vendor/resourceRequest/fetchVendorOpenings.js";
import {getVendorOpeningDetails} from "../../controllers/vendor/resourceRequest/fetchVendorOpeningDetails.js";
import { presignVendorProfile } from "../../controllers/vendor/resourceRequest/presignVendorProfile.js";
import { submitVendorProfilesController } from "../../controllers/vendor/resourceRequest/submitVendorprofile.js";
const router = express.Router();

/**
 * @route /vendor/requests
 */
router.use("/requests", vendorRequestRoutes);

router.get(
  "/openings",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  getVendorOpenings
);

router.get(
  "/openings/:id",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  getVendorOpeningDetails
);

router.post(
  "/openings/:id/profiles/presign",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  presignVendorProfile
);

router.post(
  "/openings/:id/profiles/upload",
  authenticateUser,
  authorizeRole("IT_VENDOR"),
  submitVendorProfilesController
);



export default router;
