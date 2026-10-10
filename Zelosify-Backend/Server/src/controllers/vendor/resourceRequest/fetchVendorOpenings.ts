
import type { Request, Response } from "express";
import { fetchVendorOpenings } from "../../../services/hiring/vendorOpeningService";

export async function getVendorOpenings(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // This user object is populated by authenticateUser middleware.
    const user = req.user;

    // Never accept tenantId from the query string.
    const tenantId = user?.tenant?.tenantId;

    if (!tenantId) {
      res.status(403).json({
        message: "Your account is not associated with a tenant.",
      });
      return;
    }

    const pageParam = req.query.page ?? "1";
    const limitParam = req.query.limit ?? "10";

    const page = Number(pageParam);
    const limit = Number(limitParam);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      res.status(400).json({
        message: "page must be >= 1 and limit must be between 1 and 100.",
      });
      return;
    }

    const result = await fetchVendorOpenings({
      tenantId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to fetch vendor openings:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch openings.",
    });
  }
}
