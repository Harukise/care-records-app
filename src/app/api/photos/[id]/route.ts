import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caption, url } = await request.json();

    if (caption === undefined && url === undefined) {
      return NextResponse.json(
        { error: "Caption or URL is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (caption !== undefined) updateData.caption = caption;
    if (url !== undefined) updateData.url = url;

    const photo = await prisma.photo.update({
      where: {
        id: params.id,
      },
      data: updateData,
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

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
