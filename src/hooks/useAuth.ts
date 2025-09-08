import { useState, useEffect } from 'react';
import { User } from '../types';
import { mockUsers } from '../lib/mock-data';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // シミュレートされた認証状態の確認
    console.log('useAuth useEffect running');
    const savedUser = localStorage.getItem('currentUser');
    console.log('Saved user from localStorage:', savedUser);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('Parsed user:', parsedUser);
        
        // 文字列からDateオブジェクトに変換
        const userWithDates = {
          ...parsedUser,
          createdAt: new Date(parsedUser.createdAt),
          updatedAt: new Date(parsedUser.updatedAt),
        };
        
        setUser(userWithDates);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    console.log('useAuth login called:', { email, password });
    console.log('Available users:', mockUsers);
    
    // モック認証
    const foundUser = mockUsers.find(u => u.email === email);
    console.log('Found user:', foundUser);
    
    if (foundUser) {
      // Date オブジェクトを文字列に変換してから保存
      const userToSave = {
        ...foundUser,
        createdAt: foundUser.createdAt.toISOString(),
        updatedAt: foundUser.updatedAt.toISOString(),
      };
      
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(userToSave));
      console.log('Login successful, user set:', foundUser);
      return { success: true };
    }
    console.log('User not found');
    return { success: false, error: 'ユーザーが見つかりません' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}