
import prisma from "../../config/prisma/prisma.js";
import { createStorageService } from "../storage/storageFactory.js";

interface SubmitVendorProfilesParams {
  openingId: string;
  tenantId: string;
  userId: string;
  s3Keys: string[];
}

const storageService = createStorageService();

export async function submitVendorProfiles({
  openingId,
  tenantId,
  userId,
  s3Keys,
}: SubmitVendorProfilesParams) {
  
  if (!s3Keys.length) {
    throw new Error("At least one uploaded profile is required");
  }

  if (s3Keys.length > 20) {
    throw new Error("You can submit at most 20 profiles per request");
  }

  if (new Set(s3Keys).size !== s3Keys.length) {
    throw new Error("Duplicate S3 keys are not allowed");
  }

  
  const opening = await prisma.opening.findFirst({
    where: {
      id: openingId,
      tenantId,
      status: "OPEN",
    },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (!opening) {
    throw new Error("Opening not found, inaccessible, or not open");
  }

  //  allowing files inside this tenant's folder for this opening.
  const requiredPrefix = `${tenantId}/${openingId}/`;

  for (const key of s3Keys) {
    if (
      typeof key !== "string" ||
      !key.startsWith(requiredPrefix) ||
      key.length <= requiredPrefix.length ||
      key.includes("..")
    ) {
      throw new Error("Invalid S3 key for this tenant or opening");
    }
  }

  
  const storedObjects = await storageService.listObjects(requiredPrefix);
  const existingKeys = new Set(
    storedObjects.map((object: { Key?: string }) => object.Key)
  );

  const missingKeys = s3Keys.filter((key) => !existingKeys.has(key));

  if (missingKeys.length > 0) {
    throw new Error(
      `Some uploaded files were not found in storage (${missingKeys.length} missing)`
    );
  }

  
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.hiringProfile.createMany({
      data: s3Keys.map((s3Key) => ({
        openingId,
        s3Key,
        uploadedBy: userId,
        status: "SUBMITTED" as const,
      })),
    });

    return { submittedCount: created.count };
  });

  return result;
}

