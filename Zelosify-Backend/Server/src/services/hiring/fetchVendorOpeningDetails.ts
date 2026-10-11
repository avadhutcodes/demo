import prisma from "../../config/prisma/prisma.js";

interface FetchOpeningDetailsOptions {
  openingId: string;
  tenantId: string;
}

export async function fetchVendorOpeningDetails({
  openingId,
  tenantId,
}: FetchOpeningDetailsOptions) {
  const opening = await prisma.opening.findFirst({
    where: {
      id: openingId,
      tenantId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      contractType: true,
      experienceMin: true,
      experienceMax: true,
      postedDate: true,
      status: true,

      hiringManager: {
        select: {
          firstName: true,
          lastName: true,
        },
      },

      hiringProfiles: {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          uploadedBy: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  if (!opening) {
    return null;
  }

  const {
    hiringProfiles,
    hiringManager,
    ...openingDetails
  } = opening;

  const managerName = [
    hiringManager.firstName,
    hiringManager.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...openingDetails,
    hiringManager: {
      name: managerName || null,
    },
    experienceRange: {
      min: opening.experienceMin,
      max: opening.experienceMax,
    },
    profilesCount: hiringProfiles.length,
    profiles: hiringProfiles,
  };
}
