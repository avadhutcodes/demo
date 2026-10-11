
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";
import { submitVendorProfiles } from "../../../services/hiring/submitVendorProfiles.js";

export const submitVendorProfilesController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const openingId = req.params.id;
    const tenantId = req.user?.tenant?.tenantId;
    const userId = req.user?.id;
    const files = req.body?.files;

    if (!openingId) {
      res.status(400).json({ message: "Opening ID is required" });
      return;
    }

    if (!tenantId || !userId) {
      res.status(401).json({ message: "Authenticated user or tenant missing" });
      return;
    }

    if (
      !Array.isArray(files) ||
      files.length === 0 ||
      !files.every(
        (file: unknown) =>
          typeof file === "object" &&
          file !== null &&
          "s3Key" in file &&
          typeof file.s3Key === "string"
      )
    ) {
      res.status(400).json({
        message: 'Provide files as an array of objects: [{ "s3Key": "..." }]',
      });
      return;
    }

    const s3Keys: string[] = files.map(
      (file: { s3Key: string }) => file.s3Key
    );

    const result = await submitVendorProfiles({
      openingId,
      tenantId,
      userId,
      s3Keys,
    });

    res.status(201).json({
      success: true,
      message: "Profiles submitted successfully",
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit profiles";

    if (
      message.includes("Opening not found") ||
      message.includes("not found in storage")
    ) {
      res.status(404).json({ success: false, message });
      return;
    }

    if (
      message.includes("required") ||
      message.includes("at most") ||
      message.includes("Duplicate") ||
      message.includes("Invalid S3 key")
    ) {
      res.status(400).json({ success: false, message });
      return;
    }

    console.error("Error submitting vendor profiles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit profiles",
    });
  }
};

