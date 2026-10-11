
import type { Request, Response } from "express";
import prisma from "../../../config/prisma/prisma.js";
import { FilePresignService } from "../../../services/upload/filePresignService.js";

const filePresignService = new FilePresignService();

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
};

export async function presignVendorProfile(
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

    const { filename, contentType } = req.body ?? {};

    if (
      typeof filename !== "string" ||
      filename.trim().length === 0 ||
      typeof contentType !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "filename and contentType are required",
      });
      return;
    }

    if (!ALLOWED_CONTENT_TYPES[contentType]) {
      res.status(400).json({
        success: false,
        message: "Only PDF and DOCX resumes are allowed",
      });
      return;
    }

    if (
      filename.length > 200 ||
      filename.includes("/") ||
      filename.includes("\\") ||
      filename === "." ||
      filename === ".."
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
      return;
    }

    const extension = ALLOWED_CONTENT_TYPES[contentType];

    if (!filename.toLowerCase().endsWith(extension)) {
      res.status(400).json({
        success: false,
        message: "Filename extension does not match contentType",
      });
      return;
    }

    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId,
        status: "OPEN",
      },
      select: {
        id: true,
      },
    });

    if (!opening) {
      res.status(404).json({
        success: false,
        message: "Open position not found for this tenant",
      });
      return;
    }

    const [uploadToken] = await filePresignService.generateUploadTokens(
      [filename],
      {
        tenantId,
        s3KeyConfig: {
          pathSegments: [tenantId, opening.id],
          includeTimestamp: true,
        },
        uploadEndpoint: `/api/v1/vendor/openings/${opening.id}/profiles/upload`,
        expiryDuration: 5 * 60 * 1000,
        customMetadata: {
          openingId: opening.id,
          contentType,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Upload URL generated successfully",
      ...uploadToken,
    });
  } catch (error) {
    console.error("Error generating vendor profile upload URL:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate upload URL",
    });
  }
}

