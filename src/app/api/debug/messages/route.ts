import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // デバッグ用: 認証を一時的に無効化
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get("residentId");

    console.log("Debug: residentId =", residentId);
    console.log("Debug: session =", session);
    console.log("Debug: session.user.id =", session?.user?.id);

    // まず、Messageテーブルが存在するかチェック
    try {
      const messageCount = await prisma.message.count();
      console.log("Debug: Message table exists, count =", messageCount);
    } catch (error) {
      console.error("Debug: Message table error:", error);
      return NextResponse.json(
        { error: "Message table does not exist or has issues", details: error },
        { status: 500 }
      );
    }

    if (!residentId) {
      return NextResponse.json(
        { error: "Resident ID is required" },
        { status: 400 }
      );
    }

    // 入居者が存在するかチェック
    const resident = await prisma.resident.findUnique({
      where: { id: residentId }
    });
    console.log("Debug: resident =", resident);

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 }
      );
    }

    // メッセージを取得
    const messages = await prisma.message.findMany({
      where: {
        residentId,
        // デバッグ用: 認証チェックを一時的に無効化
        // OR: [
        //   { senderId: session.user.id },
        //   { receiverId: session.user.id },
        // ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        resident: true,
      },
      orderBy: { timestamp: "asc" },
    });

    console.log("Debug: messages =", messages);

    return NextResponse.json({
      success: true,
      residentId,
      userId: session?.user?.id || 'no-session',
      messageCount: messages.length,
      messages
    });
  } catch (error) {
    console.error("Debug: Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
