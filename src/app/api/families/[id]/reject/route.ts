import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 家族ユーザーと関連データを削除
    await prisma.$transaction(async (tx) => {
      // 家族関係を削除
      await tx.residentFamily.deleteMany({
        where: { userId: params.id },
      });

      // 家族ユーザーを削除
      await tx.user.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ 
      message: "Family user rejected and removed successfully" 
    });
  } catch (error) {
    console.error("Error rejecting family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
