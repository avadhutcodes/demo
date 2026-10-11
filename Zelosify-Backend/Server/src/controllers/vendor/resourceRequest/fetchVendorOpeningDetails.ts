import type { Request, Response } from "express";
import { fetchVendorOpeningDetails } from "../../../services/hiring/fetchVendorOpeningDetails.js";

export async function getVendorOpeningDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const openingId = req.params.id;
    const tenantId = req.user?.tenant?.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        message: "Tenant information is missing",
      });
      return;
    }

    if (!openingId) {
      res.status(400).json({
        success: false,
        message: "Opening ID is required",
      });
      return;
    }

    const opening = await fetchVendorOpeningDetails({
      openingId,
      tenantId,
    });

    if (!opening) {
      res.status(404).json({
        success: false,
        message: "Opening not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      opening,
    });
  } catch (error) {
    console.error("Error fetching vendor opening details:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch opening details",
    });
  }
}
