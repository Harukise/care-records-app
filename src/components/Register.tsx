"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Heart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    residentName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // エラーをクリア
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // バリデーション
    if (!formData.name.trim()) {
      setError('家族名を入力してください');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('メールアドレスを入力してください');
      setIsLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError('パスワードを入力してください');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    if (!formData.residentName.trim()) {
      setError('入居者名を入力してください');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          residentName: formData.residentName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || '登録が完了しました。ログインしてください。');
        router.push('/login');
      } else {
        setError(data.error || '登録に失敗しました');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('登録中にエラーが発生しました');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">家族新規登録</CardTitle>
          <CardDescription>
            家族アカウントを作成してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">家族名 *</Label>
              <Input
                id="name"
                type="text"
                placeholder="例: 田中 太郎"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                placeholder="例: tanaka@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード *</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="パスワードを再入力"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentName">入居者名 *</Label>
              <Input
                id="residentName"
                type="text"
                placeholder="例: 田中 花子"
                value={formData.residentName}
                onChange={(e) => handleInputChange('residentName', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                スタッフに登録された入居者の名前を正確に入力してください
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? '登録中...' : '登録'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              ログイン画面に戻る
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium mb-2 text-blue-800">登録について</p>
            <div className="space-y-1 text-sm text-blue-700">
              <p>• 家族名と入居者名は、スタッフに登録された情報と一致する必要があります</p>
              <p>• 登録後、スタッフによる承認が必要な場合があります</p>
              <p>• 不明な点がある場合は、施設スタッフにお問い合わせください</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
