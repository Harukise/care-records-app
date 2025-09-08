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
    const date = searchParams.get("date");
    const userRole = session.user.role;

    let whereClause: any = {};

    // 家族ユーザーの場合、関連する入居者の記録のみを取得
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

    if (residentId) {
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

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    const careRecords = await prisma.careRecord.findMany({
      where: whereClause,
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json(careRecords);
  } catch (error) {
    console.error("Error fetching care records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("Session:", session);
    
    if (!session || session.user.role !== "STAFF") {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      residentId,
      date,
      meal,
      bath,
      toilet,
      medicine,
      vital,
      note,
    } = await request.json();

    console.log("Request data:", {
      residentId,
      date,
      meal,
      bath,
      toilet,
      medicine,
      vital,
      note,
    });

    if (!residentId || !date) {
      return NextResponse.json(
        { error: "Resident ID and date are required" },
        { status: 400 }
      );
    }

    const careRecord = await prisma.careRecord.create({
      data: {
        residentId,
        staffId: session.user.id,
        date: new Date(date),
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

    console.log("Created care record:", careRecord);
    console.log("Care record ID:", careRecord.id);
    console.log("Resident ID:", careRecord.residentId);
    console.log("Staff ID:", careRecord.staffId);

    return NextResponse.json(careRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating care record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
