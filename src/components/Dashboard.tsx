import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, FileText, Camera, MessageSquare, Heart, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { mockResidents, mockCareRecords, mockPhotos, mockMessages } from '../lib/mock-data';
import { useState, useEffect } from 'react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

interface DashboardStats {
  totalResidents: number;
  todayRecords: number;
  totalPhotos: number;
  weeklyPhotos: number;
  unreadMessages: number;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [familyResidents, setFamilyResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchFamilyResidents = async () => {
      if (user?.role === 'FAMILY') {
        try {
          const response = await fetch('/api/residents');
          if (response.ok) {
            const data = await response.json();
            setFamilyResidents(data);
          }
        } catch (error) {
          console.error('Failed to fetch family residents:', error);
        }
      }
    };

    fetchStats();
    fetchFamilyResidents();
  }, [user?.role]);

  const todayRecords = mockCareRecords.filter(
    record => record.date.toDateString() === new Date().toDateString()
  );

  const recentPhotos = mockPhotos.slice(0, 3);
  const unreadMessages = mockMessages.slice(0, 2);

  if (user?.role === 'STAFF') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">スタッフダッシュボード</h1>
          <p className="text-muted-foreground">
            おはようございます、{user.name}さん。今日もお疲れ様です。
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">入居者数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats?.totalResidents || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                今月の新規入居 +1
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日の記録</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats?.todayRecords || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                残り {(stats?.totalResidents || 0) - (stats?.todayRecords || 0)} 件
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">写真投稿</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats?.weeklyPhotos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                今週の投稿数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">メッセージ</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats?.unreadMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                未読メッセージ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使用する機能にすぐアクセス</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-20 flex flex-col space-y-2"
              onClick={() => onNavigate('care-record')}
            >
              <FileText className="h-6 w-6" />
              <span>介護記録入力</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => onNavigate('photos')}
            >
              <Camera className="h-6 w-6" />
              <span>写真投稿</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => onNavigate('chat')}
            >
              <MessageSquare className="h-6 w-6" />
              <span>メッセージ確認</span>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>最近の活動</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayRecords.map((record) => {
              const resident = mockResidents.find(r => r.id === record.residentId);
              return (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Activity className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{resident?.name}さんの記録を更新</p>
                      <p className="text-sm text-muted-foreground">
                        {record.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">完了</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Family Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">家族ダッシュボード</h1>
        <p className="text-muted-foreground">
          こんにちは、{user?.name}さん。
        </p>
      </div>

      {/* Resident Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            ご家族の様子
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          ) : familyResidents.length > 0 ? (
            familyResidents.map((resident) => (
              <div key={resident.id} className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{resident.name}さん</h3>
                  <p className="text-muted-foreground">
                    {new Date().getFullYear() - new Date(resident.birthday).getFullYear()}歳
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  良好
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">関連する入居者情報が見つかりません</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日の記録</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">更新済み</div>
            <p className="text-xs text-muted-foreground">
              最終更新: 15:30
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新しい写真</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPhotos.length}</div>
            <p className="text-xs text-muted-foreground">
              今週投稿された写真
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">メッセージ</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              新しいメッセージ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>メニュー</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            className="h-20 flex flex-col space-y-2"
            onClick={() => onNavigate('reports')}
          >
            <FileText className="h-6 w-6" />
            <span>介護レポート</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col space-y-2"
            onClick={() => onNavigate('photos')}
          >
            <Camera className="h-6 w-6" />
            <span>写真を見る</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col space-y-2"
            onClick={() => onNavigate('chat')}
          >
            <MessageSquare className="h-6 w-6" />
            <span>スタッフに連絡</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}