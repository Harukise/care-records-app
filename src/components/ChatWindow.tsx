import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Send, MessageSquare, User, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { mockResidents, mockMessages } from '../lib/mock-data';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function ChatWindow() {
  const { data: session } = useSession();
  const [selectedResident, setSelectedResident] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 入居者データを取得
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await fetch('/api/residents');
        if (response.ok) {
          const data = await response.json();
          setResidents(data);
          if (data.length > 0 && !selectedResident) {
            setSelectedResident(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
        toast.error('入居者データの取得に失敗しました');
      }
    };

    fetchResidents();
  }, [selectedResident]);

  // スタッフデータを取得（家族ユーザーの場合のみ）
  useEffect(() => {
    if (session?.user?.role !== 'FAMILY') return;

    const fetchStaff = async () => {
      try {
        const response = await fetch('/api/staff');
        if (response.ok) {
          const data = await response.json();
          setStaff(data);
          if (!selectedStaff) {
            setSelectedStaff('all'); // デフォルトで「すべて」を選択
          }
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast.error('スタッフデータの取得に失敗しました');
      }
    };

    fetchStaff();
  }, [session?.user?.role, selectedStaff]);

  // メッセージデータを取得
  useEffect(() => {
    if (!selectedResident) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/messages?residentId=${selectedResident}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          const errorData = await response.json();
          console.error('Error fetching messages:', errorData);
          toast.error(`メッセージの取得に失敗しました: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('メッセージの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedResident]);

  useEffect(() => {
    // メッセージが更新されたら最下部にスクロール
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getFilteredMessages = () => {
    let filteredMessages = messages;
    
    if (session?.user?.role === 'STAFF') {
      // スタッフの場合：選択された入居者のメッセージのみ
      filteredMessages = messages.filter(message => message.residentId === selectedResident);
    } else if (session?.user?.role === 'FAMILY') {
      // 家族の場合：選択されたスタッフのメッセージのみ（「すべて」でない場合）
      if (selectedStaff && selectedStaff !== 'all') {
        filteredMessages = messages.filter(message => 
          message.senderId === selectedStaff || message.receiverId === selectedStaff
        );
      }
    }
    
    return filteredMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getChatPartner = () => {
    if (!session?.user) return null;
    
    // 現在のユーザーがスタッフの場合は家族を、家族の場合はスタッフを取得
    const filteredMessages = getFilteredMessages();
    if (filteredMessages.length === 0) return null;

    const partnerIds = new Set();
    filteredMessages.forEach(msg => {
      if (msg.senderId !== session.user.id) partnerIds.add(msg.senderId);
      if (msg.receiverId !== session.user.id) partnerIds.add(msg.receiverId);
    });

    // パートナー情報をメッセージから取得
    const partnerMessage = filteredMessages.find(msg => 
      msg.senderId !== session.user.id || msg.receiverId !== session.user.id
    );
    
    return partnerMessage ? {
      id: partnerMessage.senderId !== session.user.id ? partnerMessage.senderId : partnerMessage.receiverId,
      name: partnerMessage.senderId !== session.user.id ? partnerMessage.sender.name : partnerMessage.receiver.name,
      role: partnerMessage.senderId !== session.user.id ? partnerMessage.sender.role : partnerMessage.receiver.role
    } : null;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user) return;

    // スタッフの場合は入居者が必要、家族の場合は特定のスタッフが必要
    if (session.user.role === 'STAFF' && !selectedResident) return;
    if (session.user.role === 'FAMILY' && (!selectedStaff || selectedStaff === 'all')) {
      toast.error('メッセージを送信するには、特定のスタッフを選択してください');
      return;
    }

    setSending(true);
    try {
      let receiverId: string;
      let residentId: string;

      if (session.user.role === 'STAFF') {
        // スタッフの場合：入居者に関連付けられた家族を取得
        const familyResponse = await fetch(`/api/residents/${selectedResident}/family`);
        if (!familyResponse.ok) {
          const errorData = await familyResponse.json();
          console.error('Error fetching family info:', errorData);
          toast.error(`家族情報の取得に失敗しました: ${errorData.error || 'Unknown error'}`);
          return;
        }
        const familyData = await familyResponse.json();
        receiverId = familyData.userId;
        residentId = selectedResident;
      } else {
        // 家族の場合：選択されたスタッフに送信
        receiverId = selectedStaff;
        // 家族に関連付けられた入居者を取得（既に取得済みのresidentsから）
        if (residents.length > 0) {
          residentId = residents[0].id;
        } else {
          toast.error('関連する入居者情報が見つかりません');
          return;
        }
      }

      // メッセージを送信
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId,
          residentId,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        setNewMessage('');
        toast.success('メッセージを送信しました');
      } else {
        const errorData = await response.json();
        console.error('Error sending message:', errorData);
        toast.error(`メッセージの送信に失敗しました: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 削除ダイアログを開く
  const openDeleteDialog = (message: any) => {
    setDeletingMessage(message);
    setDeleteDialogOpen(true);
  };

  // 削除ダイアログを閉じる
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingMessage(null);
  };

  // メッセージを削除
  const handleDeleteMessage = async () => {
    if (!deletingMessage) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/messages/${deletingMessage.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== deletingMessage.id));
        toast.success('メッセージを削除しました');
        closeDeleteDialog();
      } else {
        const errorData = await response.json();
        toast.error(`メッセージの削除に失敗しました: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('メッセージの削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const filteredMessages = getFilteredMessages();
  const selectedResidentData = residents.find(r => r.id === selectedResident);
  const chatPartner = getChatPartner();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-semibold mb-2">メッセージ</h1>
        <p className="text-muted-foreground">
          {session?.user?.role === 'STAFF' ? '家族との連絡・相談ができます' : 'スタッフとの連絡・相談ができます'}
        </p>
      </div>

      {/* 選択セクション */}
      {session?.user?.role === 'STAFF' ? (
        <Card>
          <CardHeader>
            <CardTitle>対象入居者</CardTitle>
            <CardDescription>メッセージを確認する入居者を選択してください</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedResident} onValueChange={setSelectedResident}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>対象スタッフ</CardTitle>
            <CardDescription>メッセージを送信するスタッフを選択してください</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {staff.map((staffMember) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* チャットエリア */}
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {session?.user?.role === 'STAFF' 
                ? `${selectedResidentData?.name}さんについて`
                : selectedStaff === 'all' 
                  ? 'すべてのスタッフとのメッセージ'
                  : `${staff.find(s => s.id === selectedStaff)?.name || 'スタッフ'}とのメッセージ`
              }
            </CardTitle>
            {chatPartner && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {chatPartner.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{chatPartner.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {chatPartner.role === 'STAFF' ? 'スタッフ' : '家族'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {/* メッセージリスト */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">メッセージがありません</p>
                  <p className="text-muted-foreground">
                    最初のメッセージを送信してください
                  </p>
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const sender = message.sender;
                  const isCurrentUser = message.senderId === session?.user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {sender?.name.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-muted-foreground">
                            {sender?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(message.timestamp), 'HH:mm', { locale: ja })}
                          </p>
                          {isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(message)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div
                          className={`p-3 rounded-lg ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* メッセージ入力 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="メッセージを入力してください..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enterキーで送信、Shift+Enterで改行
          </p>
        </div>
      </Card>

      {/* メッセージ履歴統計 */}
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            メッセージ履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{filteredMessages.length}</p>
              <p className="text-sm text-muted-foreground">総メッセージ数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {filteredMessages.filter(m => m.senderId === session?.user?.id).length}
              </p>
              <p className="text-sm text-muted-foreground">送信済み</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredMessages.length > 0 ? format(filteredMessages[filteredMessages.length - 1].timestamp, 'MM/dd', { locale: ja }) : '--'}
              </p>
              <p className="text-sm text-muted-foreground">最後のメッセージ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メッセージを削除</DialogTitle>
            <DialogDescription>
              このメッセージを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deletingMessage && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{deletingMessage.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(deletingMessage.timestamp), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDeleteDialog}>
                キャンセル
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteMessage}
                disabled={deleting}
              >
                {deleting ? '削除中...' : '削除'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}