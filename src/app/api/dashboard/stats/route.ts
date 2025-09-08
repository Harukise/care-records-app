import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 現在のユーザーセッションを取得
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const userRole = session?.user?.role;

    // 入居者数（家族ユーザーの場合は関連する入居者のみ）
    let totalResidents;
    if (userRole === 'FAMILY') {
      // 家族ユーザーの場合、関連する入居者のみをカウント
      const familyResidents = await prisma.residentFamily.findMany({
        where: { userId: currentUserId },
        include: { resident: true },
      });
      totalResidents = familyResidents.length;
    } else {
      // スタッフの場合は全入居者をカウント
      totalResidents = await prisma.resident.count();
    }

    // 今日の記録数（家族ユーザーの場合は関連する入居者の記録のみ）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayRecords;
    if (userRole === 'FAMILY') {
      // 家族ユーザーの場合、関連する入居者の記録のみをカウント
      const familyResidents = await prisma.residentFamily.findMany({
        where: { userId: currentUserId },
        select: { residentId: true },
      });
      const residentIds = familyResidents.map(rf => rf.residentId);
      
      todayRecords = await prisma.careRecord.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          residentId: {
            in: residentIds,
          },
        },
      });
    } else {
      // スタッフの場合は全記録をカウント
      todayRecords = await prisma.careRecord.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
    }

    // 写真投稿数（家族ユーザーの場合は関連する入居者の写真のみ）
    let totalPhotos;
    let weeklyPhotos;
    
    if (userRole === 'FAMILY') {
      // 家族ユーザーの場合、関連する入居者の写真のみをカウント
      const familyResidents = await prisma.residentFamily.findMany({
        where: { userId: currentUserId },
        select: { residentId: true },
      });
      const residentIds = familyResidents.map(rf => rf.residentId);
      
      totalPhotos = await prisma.photo.count({
        where: {
          residentId: {
            in: residentIds,
          },
        },
      });

      // 今週の写真投稿数
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      weeklyPhotos = await prisma.photo.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
          residentId: {
            in: residentIds,
          },
        },
      });
    } else {
      // スタッフの場合は全写真をカウント
      totalPhotos = await prisma.photo.count();

      // 今週の写真投稿数
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      weeklyPhotos = await prisma.photo.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      });
    }

    // 未読メッセージ数（現在のユーザー宛て）
    // 既存データにisReadフィールドがない場合の対応
    let unreadMessages = 0;
    if (currentUserId) {
      try {
        unreadMessages = await prisma.message.count({
          where: {
            receiverId: currentUserId,
            isRead: false,
          },
        });
      } catch (error) {
        // isReadフィールドが存在しない場合は、すべてのメッセージを未読として扱う
        console.log('isRead field not found, treating all messages as unread');
        unreadMessages = await prisma.message.count({
          where: {
            receiverId: currentUserId,
          },
        });
      }
    }

    return NextResponse.json({
      totalResidents,
      todayRecords,
      totalPhotos,
      weeklyPhotos,
      unreadMessages,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
