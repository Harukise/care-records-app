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

    // 家族ユーザーを承認済みに更新
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isApproved: true,
      },
    });

    return NextResponse.json({ 
      message: "Family user approved successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error approving family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
