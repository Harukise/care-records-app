import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function FamilyApprovalManagement() {
  const [pendingFamilies, setPendingFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 未承認の家族ユーザーを取得
  useEffect(() => {
    const fetchPendingFamilies = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/families/pending');
        if (response.ok) {
          const data = await response.json();
          setPendingFamilies(data);
        } else {
          toast.error('未承認家族の取得に失敗しました');
        }
      } catch (error) {
        console.error('Error fetching pending families:', error);
        toast.error('未承認家族の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingFamilies();
  }, []);

  // 家族ユーザーを承認
  const handleApproveFamily = async (familyId: string) => {
    try {
      const response = await fetch(`/api/families/${familyId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        setPendingFamilies(prev => prev.filter(family => family.id !== familyId));
        toast.success('家族ユーザーを承認しました');
      } else {
        toast.error('承認に失敗しました');
      }
    } catch (error) {
      console.error('Error approving family:', error);
      toast.error('承認に失敗しました');
    }
  };

  // 家族ユーザーを拒否
  const handleRejectFamily = async (familyId: string) => {
    try {
      const response = await fetch(`/api/families/${familyId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setPendingFamilies(prev => prev.filter(family => family.id !== familyId));
        toast.success('家族ユーザーを拒否しました');
      } else {
        toast.error('拒否に失敗しました');
      }
    } catch (error) {
      console.error('Error rejecting family:', error);
      toast.error('拒否に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">家族承認管理</h1>
        <p className="text-muted-foreground">
          アプリに登録を申請した家族ユーザーの承認を行います
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFamilies.length}</div>
            <p className="text-xs text-muted-foreground">
              承認待ちの家族
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 承認待ち家族リスト */}
      <Card>
        <CardHeader>
          <CardTitle>承認待ち家族</CardTitle>
          <CardDescription>
            アプリに登録を申請した家族ユーザーの一覧です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">読み込み中...</p>
            </div>
          ) : pendingFamilies.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">承認待ちの家族はいません</p>
              <p className="text-muted-foreground">
                すべての家族ユーザーが承認済みです
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {pendingFamilies.map((family) => (
                  <Card key={family.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {family.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold">{family.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {family.email}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">関連入居者:</span> {family.residentName}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">登録日:</span> {new Date(family.createdAt).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                            
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              承認待ち
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveFamily(family.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            承認
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectFamily(family.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒否
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
