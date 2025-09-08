import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    let residents;

    if (userRole === 'FAMILY') {
      // 家族ユーザーの場合、関連する入居者のみを取得
      const familyResidents = await prisma.residentFamily.findMany({
        where: { userId: session.user.id },
        include: { resident: true },
        orderBy: { createdAt: "desc" },
      });
      residents = familyResidents.map(rf => rf.resident);
    } else {
      // スタッフの場合は全入居者を取得
      residents = await prisma.resident.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(residents);
  } catch (error) {
    console.error("Error fetching residents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      name, 
      birthday, 
      familyName, 
      familyEmail, 
      familyPhone, 
      familyRelation 
    } = await request.json();

    if (!name || !birthday) {
      return NextResponse.json(
        { error: "Name and birthday are required" },
        { status: 400 }
      );
    }

    if (!familyName || !familyEmail) {
      return NextResponse.json(
        { error: "Family name and email are required" },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: familyEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // トランザクションで入居者と家族情報を同時に作成
    const result = await prisma.$transaction(async (tx) => {
      // 入居者を作成
      const resident = await tx.resident.create({
        data: {
          name,
          birthday: new Date(birthday),
        },
      });

      // 家族ユーザーを作成（未承認状態）
      const familyUser = await tx.user.create({
        data: {
          name: familyName,
          email: familyEmail,
          role: "FAMILY",
          isApproved: false, // 未承認状態
        },
      });

      // 入居者と家族の紐づけを作成
      await tx.residentFamily.create({
        data: {
          residentId: resident.id,
          userId: familyUser.id,
        },
      });

      return { resident, familyUser };
    });

    return NextResponse.json(result.resident, { status: 201 });
  } catch (error) {
    console.error("Error creating resident:", error);
    
    // より詳細なエラーメッセージを提供
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 400 }
        );
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: "データの関連付けに失敗しました" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
