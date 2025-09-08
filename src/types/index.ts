export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STAFF' | 'FAMILY';
  createdAt: Date;
  updatedAt: Date;
}

export interface Resident {
  id: string;
  name: string;
  birthday: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareRecord {
  id: string;
  residentId: string;
  staffId: string;
  date: Date;
  meal: string;
  bath: string;
  toilet: string;
  medicine: string;
  vital: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: string;
  residentId: string;
  url: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  residentId: string;
  content: string;
  isRead: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}