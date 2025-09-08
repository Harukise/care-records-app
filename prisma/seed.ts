import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // パスワードのハッシュ化
  const hashedPassword = await bcrypt.hash('password123', 12);

  // ユーザーの作成
  const staff1 = await prisma.user.upsert({
    where: { email: 'tanaka@example.com' },
    update: {},
    create: {
      email: 'tanaka@example.com',
      name: '田中 花子',
      password: hashedPassword,
      role: 'STAFF',
    },
  });

  const family1 = await prisma.user.upsert({
    where: { email: 'sato.family@example.com' },
    update: {},
    create: {
      email: 'sato.family@example.com',
      name: '佐藤 太郎',
      password: hashedPassword,
      role: 'FAMILY',
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'yamada@example.com' },
    update: {},
    create: {
      email: 'yamada@example.com',
      name: '山田 美咲',
      password: hashedPassword,
      role: 'STAFF',
    },
  });

  // 入居者の作成
  const resident1 = await prisma.resident.upsert({
    where: { id: 'resident-1' },
    update: {},
    create: {
      id: 'resident-1',
      name: '佐藤 花江',
      birthday: new Date('1935-05-15'),
    },
  });

  const resident2 = await prisma.resident.upsert({
    where: { id: 'resident-2' },
    update: {},
    create: {
      id: 'resident-2',
      name: '鈴木 一郎',
      birthday: new Date('1940-08-22'),
    },
  });

  const resident3 = await prisma.resident.upsert({
    where: { id: 'resident-3' },
    update: {},
    create: {
      id: 'resident-3',
      name: '高橋 よし子',
      birthday: new Date('1938-12-03'),
    },
  });

  // 家族関係の設定
  await prisma.residentFamily.upsert({
    where: {
      residentId_userId: {
        residentId: resident1.id,
        userId: family1.id,
      },
    },
    update: {},
    create: {
      residentId: resident1.id,
      userId: family1.id,
    },
  });

  // 介護記録の作成
  await prisma.careRecord.upsert({
    where: { id: 'record-1' },
    update: {},
    create: {
      id: 'record-1',
      residentId: resident1.id,
      staffId: staff1.id,
      date: new Date('2024-01-15'),
      meal: '朝食：おかゆ完食、昼食：普通食8割摂取、夕食：普通食完食',
      bath: '入浴済み（15:30-16:00）温度38℃',
      toilet: '排尿：正常、排便：1回（午前中）',
      medicine: '血圧薬服用済み（朝・夕）',
      vital: '体温36.5℃、血圧128/80、脈拍72',
      note: 'お元気でよく笑顔を見せてくださいました。食欲も良好です。',
    },
  });

  await prisma.careRecord.upsert({
    where: { id: 'record-2' },
    update: {},
    create: {
      id: 'record-2',
      residentId: resident1.id,
      staffId: staff2.id,
      date: new Date('2024-01-16'),
      meal: '朝食：普通食完食、昼食：普通食9割摂取、夕食：普通食完食',
      bath: '清拭のみ（ご本人希望）',
      toilet: '排尿：正常、排便：なし',
      medicine: '血圧薬服用済み（朝・夕）',
      vital: '体温36.8℃、血圧132/85、脈拍75',
      note: '少し血圧が高めでしたが、ご本人に体調不良の訴えはありませんでした。',
    },
  });

  // 写真の作成
  await prisma.photo.upsert({
    where: { id: 'photo-1' },
    update: {},
    create: {
      id: 'photo-1',
      residentId: resident1.id,
      userId: staff1.id,
      url: '/uploads/sample1.jpg',
      caption: 'レクリエーション活動の様子',
    },
  });

  // メッセージの作成
  await prisma.message.upsert({
    where: { id: 'message-1' },
    update: {},
    create: {
      id: 'message-1',
      senderId: family1.id,
      receiverId: staff1.id,
      residentId: resident1.id,
      content: 'いつもお世話になっております。昨日の様子はいかがでしたでしょうか？',
      timestamp: new Date('2024-01-16T09:00:00'),
    },
  });

  await prisma.message.upsert({
    where: { id: 'message-2' },
    update: {},
    create: {
      id: 'message-2',
      senderId: staff1.id,
      receiverId: family1.id,
      residentId: resident1.id,
      content: 'お疲れ様です。昨日はとてもお元気で、レクリエーションにも積極的に参加されていました。血圧が少し高めでしたが、体調に問題はございません。',
      timestamp: new Date('2024-01-16T10:30:00'),
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
