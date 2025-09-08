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

    const careRecord = await prisma.careRecord.findUnique({
      where: { id: params.id },
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
    });

    if (!careRecord) {
      return NextResponse.json({ error: "Care record not found" }, { status: 404 });
    }

    return NextResponse.json(careRecord);
  } catch (error) {
    console.error("Error fetching care record:", error);
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

    const {
      meal,
      bath,
      toilet,
      medicine,
      vital,
      note,
    } = await request.json();

    const careRecord = await prisma.careRecord.update({
      where: { id: params.id },
      data: {
        meal,
        bath,
        toilet,
        medicine,
        vital,
        note,
      },
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
    });

    return NextResponse.json(careRecord);
  } catch (error) {
    console.error("Error updating care record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.careRecord.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Care record deleted successfully" });
  } catch (error) {
    console.error("Error deleting care record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


