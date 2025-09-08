import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 最新の介護記録を取得
    const latestCareRecord = await prisma.careRecord.findFirst({
      include: {
        resident: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 最新の入居者を取得
    const latestResident = await prisma.resident.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // 最新の入居者の最新記録を取得
    const latestResidentRecord = latestResident ? await prisma.careRecord.findFirst({
      where: {
        residentId: latestResident.id,
      },
      include: {
        resident: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }) : null;

    return NextResponse.json({
      latestCareRecord,
      latestResident,
      latestResidentRecord,
      summary: {
        hasCareRecords: !!latestCareRecord,
        hasResidents: !!latestResident,
        hasLatestResidentRecord: !!latestResidentRecord,
      }
    });
  } catch (error) {
    console.error("Error fetching latest care record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


