import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residentId = params.id;

    const residentFamily = await prisma.residentFamily.findFirst({
      where: { residentId: residentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isApproved: true,
          },
        },
      },
    });

    if (!residentFamily) {
      return NextResponse.json(
        { error: "家族情報が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(residentFamily);
  } catch (error) {
    console.error("Error fetching resident family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyUserId } = await request.json();

    if (!familyUserId) {
      return NextResponse.json(
        { error: "Family user ID is required" },
        { status: 400 }
      );
    }

    // トランザクションで家族関係を更新
    const result = await prisma.$transaction(async (tx) => {
      // 既存の家族関係を削除
      await tx.residentFamily.deleteMany({
        where: { residentId: params.id },
      });

      // 新しい家族関係を作成
      const residentFamily = await tx.residentFamily.create({
        data: {
          residentId: params.id,
          userId: familyUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return residentFamily;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating resident family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}