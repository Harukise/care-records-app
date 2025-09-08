import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 全ての介護記録を取得
    const allCareRecords = await prisma.careRecord.findMany({
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

    // 全ての入居者を取得
    const allResidents = await prisma.resident.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 全てのユーザーを取得
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      careRecords: allCareRecords,
      residents: allResidents,
      users: allUsers,
      counts: {
        careRecords: allCareRecords.length,
        residents: allResidents.length,
        users: allUsers.length,
      }
    });
  } catch (error) {
    console.error("Error fetching debug data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


