import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get("residentId");
    const userRole = session.user.role;

    let whereClause: any = {};

    // 家族ユーザーの場合、関連する入居者の写真のみを取得
    if (userRole === 'FAMILY') {
      const familyResidents = await prisma.residentFamily.findMany({
        where: { userId: session.user.id },
        select: { residentId: true },
      });
      const residentIds = familyResidents.map(rf => rf.residentId);
      
      whereClause.residentId = {
        in: residentIds,
      };
    }

    if (residentId && residentId !== "all") {
      // 家族ユーザーの場合、指定された入居者が関連する入居者かチェック
      if (userRole === 'FAMILY') {
        const familyResidents = await prisma.residentFamily.findMany({
          where: { userId: session.user.id },
          select: { residentId: true },
        });
        const residentIds = familyResidents.map(rf => rf.residentId);
        
        if (!residentIds.includes(residentId)) {
          return NextResponse.json({ error: "Unauthorized access to resident" }, { status: 403 });
        }
      }
      whereClause.residentId = residentId;
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      include: {
        resident: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
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

    const { residentId, url, caption } = await request.json();

    if (!residentId || !url) {
      return NextResponse.json(
        { error: "Resident ID and URL are required" },
        { status: 400 }
      );
    }

    const photo = await prisma.photo.create({
      data: {
        residentId,
        userId: session.user.id,
        url,
        caption,
      },
      include: {
        resident: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error creating photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
