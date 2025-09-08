"use client";

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Heart } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('ログインに失敗しました');
      } else {
        // ログイン成功時はページが自動的にリロードされる
        window.location.href = '/';
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('ログイン中にエラーが発生しました');
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
          <CardTitle className="text-2xl">介護記録共有アプリ</CardTitle>
          <CardDescription>
            アカウントにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              家族の方は{' '}
              <button
                type="button"
                onClick={() => window.location.href = '/register'}
                className="text-primary hover:underline font-medium"
              >
                新規登録
              </button>
              からアカウントを作成してください
            </p>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">テスト用アカウント:</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">スタッフアカウント:</p>
                <p>• yamada@example.com</p>
                <p>• test.staff@example.com</p>
              </div>
              <div>
                <p className="font-medium text-foreground">家族アカウント:</p>
                <p>• test.family3@example.com (承認済み)</p>
                <p>• test.family@example.com (未承認)</p>
              </div>
              <p><strong>パスワード:</strong> password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}