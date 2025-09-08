import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 未承認の家族ユーザーを取得
    const pendingFamilies = await prisma.user.findMany({
      where: {
        role: "FAMILY",
        isApproved: false,
      },
      include: {
        residentFamily: {
          include: {
            resident: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // レスポンス用のデータを整形
    const formattedFamilies = pendingFamilies.map(family => ({
      id: family.id,
      name: family.name,
      email: family.email,
      createdAt: family.createdAt,
      residentName: family.residentFamily[0]?.resident.name || "不明",
    }));

    return NextResponse.json(formattedFamilies);
  } catch (error) {
    console.error("Error fetching pending families:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
