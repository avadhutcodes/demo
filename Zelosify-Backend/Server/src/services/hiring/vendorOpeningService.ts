
import prisma from "../../config/prisma/prisma.js";

interface FetchOpeningsOptions {
  tenantId: string;
  page: number;
  limit: number;
}

export async function fetchVendorOpenings({
  tenantId,
  page,
  limit,
}: FetchOpeningsOptions) {
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    status: "OPEN" as const,
  };

  const [openings, total] = await prisma.$transaction([
    prisma.opening.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        postedDate: "desc",
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
        hiringManagerId: true,
      },
    }),
    prisma.opening.count({ where }),
  ]);

  return {
    openings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
