import express from "express";
import vendorRequestRoutes from "./vendorRequestRoutes.js";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { getVendorOpenings } from "../../controllers/vendor/resourceRequest/fetchVendorOpenings.js";
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

export default router;
