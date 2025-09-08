import { User, Resident, CareRecord, Photo, Message } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: '田中 花子',
    email: 'tanaka@example.com',
    role: 'STAFF',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: '佐藤 太郎',
    email: 'sato.family@example.com',
    role: 'FAMILY',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: '山田 美咲',
    email: 'yamada@example.com',
    role: 'STAFF',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockResidents: Resident[] = [
  {
    id: '1',
    name: '佐藤 花江',
    birthday: new Date('1935-05-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: '鈴木 一郎',
    birthday: new Date('1940-08-22'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: '高橋 よし子',
    birthday: new Date('1938-12-03'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockCareRecords: CareRecord[] = [
  {
    id: '1',
    residentId: '1',
    staffId: '1',
    date: new Date('2024-01-15'),
    meal: '朝食：おかゆ完食、昼食：普通食8割摂取、夕食：普通食完食',
    bath: '入浴済み（15:30-16:00）温度38℃',
    toilet: '排尿：正常、排便：1回（午前中）',
    medicine: '血圧薬服用済み（朝・夕）',
    vital: '体温36.5℃、血圧128/80、脈拍72',
    note: 'お元気でよく笑顔を見せてくださいました。食欲も良好です。',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    residentId: '1',
    staffId: '3',
    date: new Date('2024-01-16'),
    meal: '朝食：普通食完食、昼食：普通食9割摂取、夕食：普通食完食',
    bath: '清拭のみ（ご本人希望）',
    toilet: '排尿：正常、排便：なし',
    medicine: '血圧薬服用済み（朝・夕）',
    vital: '体温36.8℃、血圧132/85、脈拍75',
    note: '少し血圧が高めでしたが、ご本人に体調不良の訴えはありませんでした。',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

export const mockPhotos: Photo[] = [
  {
    id: '1',
    residentId: '1',
    url: '/uploads/resident1_lunch.jpg',
    userId: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    residentId: '1',
    url: '/uploads/resident1_activity.jpg',
    userId: '3',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '2',
    receiverId: '1',
    residentId: '1',
    content: 'いつもお世話になっております。昨日の様子はいかがでしたでしょうか？',
    isRead: false,
    timestamp: new Date('2024-01-16T09:00:00'),
    createdAt: new Date('2024-01-16T09:00:00'),
    updatedAt: new Date('2024-01-16T09:00:00'),
  },
  {
    id: '2',
    senderId: '1',
    receiverId: '2',
    residentId: '1',
    content: 'お疲れ様です。昨日はとてもお元気で、レクリエーションにも積極的に参加されていました。血圧が少し高めでしたが、体調に問題はございません。',
    isRead: true,
    timestamp: new Date('2024-01-16T10:30:00'),
    createdAt: new Date('2024-01-16T10:30:00'),
    updatedAt: new Date('2024-01-16T10:30:00'),
  },
  {
    id: '3',
    senderId: '2',
    receiverId: '1',
    residentId: '1',
    content: 'ありがとうございます。安心いたしました。今度の面会時に持参したいものがあるのですが、何か制限はありますでしょうか？',
    isRead: false,
    timestamp: new Date('2024-01-16T11:15:00'),
    createdAt: new Date('2024-01-16T11:15:00'),
    updatedAt: new Date('2024-01-16T11:15:00'),
  },
];