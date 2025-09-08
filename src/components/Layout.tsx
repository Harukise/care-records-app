import { User, Heart, MessageSquare, Camera, Users, FileText, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { useSession, signOut } from 'next-auth/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const staffMenuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: User },
    { id: 'residents', label: '入居者管理', icon: Users },
    { id: 'care-record', label: '介護記録入力', icon: FileText },
    { id: 'care-records-list', label: '介護記録一覧', icon: FileText },
    { id: 'photos', label: '写真', icon: Camera },
    { id: 'chat', label: 'メッセージ', icon: MessageSquare },
  ];

  const familyMenuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: User },
    { id: 'reports', label: '介護レポート', icon: FileText },
    { id: 'photos', label: '写真', icon: Camera },
    { id: 'chat', label: 'メッセージ', icon: MessageSquare },
  ];

  const menuItems = user?.role === 'STAFF' ? staffMenuItems : familyMenuItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">介護記録アプリ</h1>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'STAFF' ? 'スタッフ' : '家族'} 専用
              </p>
            </div>
          </div>

          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </Card>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <Separator className="my-6" />

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-3" />
            ログアウト
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}