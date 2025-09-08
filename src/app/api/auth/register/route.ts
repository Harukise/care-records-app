import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, residentName } = await request.json();

    if (!name || !email || !password || !residentName) {
      return NextResponse.json(
        { error: "Name, email, password, and resident name are required" },
        { status: 400 }
      );
    }

    // 名前による照合（承認状態に関係なく検索）
    const existingFamily = await prisma.user.findFirst({
      where: {
        name: name,
        role: "FAMILY",
      },
      include: {
        residentFamily: {
          include: {
            resident: true,
          },
        },
      },
    });

    if (!existingFamily) {
      return NextResponse.json(
        { error: "該当する家族情報が見つかりません。スタッフにご確認ください。" },
        { status: 404 }
      );
    }

    // 入居者名の照合
    const matchingResident = existingFamily.residentFamily.find(
      (rf) => rf.resident.name === residentName
    );

    if (!matchingResident) {
      return NextResponse.json(
        { error: "指定された入居者名と家族情報が一致しません。" },
        { status: 400 }
      );
    }

    // 既に承認済みかチェック
    if (existingFamily.isApproved) {
      return NextResponse.json(
        { error: "この家族アカウントは既に登録済みです。ログインしてください。" },
        { status: 400 }
      );
    }

    // メールアドレスの一致確認（照合された家族ユーザーのメールアドレスと一致するかチェック）
    if (existingFamily.email !== email) {
      return NextResponse.json(
        { error: "メールアドレスが一致しません。スタッフに登録されたメールアドレスを入力してください。" },
        { status: 400 }
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // 家族ユーザーを承認済みに更新
    const updatedUser = await prisma.user.update({
      where: { id: existingFamily.id },
      data: {
        password: hashedPassword,
        isApproved: true, // 承認済みに更新
      },
    });

    return NextResponse.json(
      { 
        message: "登録が完了しました。ログインしてください。",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
