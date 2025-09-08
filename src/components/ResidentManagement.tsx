import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, Plus, Edit, Calendar as CalendarIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { mockResidents, mockCareRecords } from '../lib/mock-data';
import { toast } from 'sonner';

export function ResidentManagement() {
  const [residents, setResidents] = useState<any[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<{ id: string; name: string; birthday: Date; familyUserId?: string } | null>(null);
  const [familyUsers, setFamilyUsers] = useState<any[]>([]);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [careRecords, setCareRecords] = useState<any[]>([]);
  const [newResident, setNewResident] = useState({
    name: '',
    birthday: new Date(),
    familyName: '',
    familyEmail: '',
    familyPhone: '',
    familyRelation: '',
  });
  const [newResidentDateOpen, setNewResidentDateOpen] = useState(false);
  const [editResidentDateOpen, setEditResidentDateOpen] = useState(false);
  const [newResidentCalendarMonth, setNewResidentCalendarMonth] = useState(new Date());
  const [editResidentCalendarMonth, setEditResidentCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // 入居者データをAPIから取得
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/residents');
        if (response.ok) {
          const data = await response.json();
          setResidents(data);
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
        toast.error('入居者データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    const fetchCareRecords = async () => {
      try {
        const response = await fetch('/api/care-records');
        if (response.ok) {
          const data = await response.json();
          setCareRecords(data);
        }
      } catch (error) {
        console.error('Error fetching care records:', error);
      }
    };

    fetchResidents();
    fetchCareRecords();
  }, []);

  // 家族ユーザーを取得
  const fetchFamilyUsers = async () => {
    try {
      const response = await fetch('/api/families');
      if (response.ok) {
        const data = await response.json();
        setFamilyUsers(data);
      }
    } catch (error) {
      console.error('Error fetching family users:', error);
      toast.error('家族ユーザーの取得に失敗しました');
    }
  };

  // 入居者の現在の家族関係を取得
  const fetchCurrentFamily = async (residentId: string) => {
    try {
      const response = await fetch(`/api/residents/${residentId}/family`);
      if (response.ok) {
        const data = await response.json();
        setCurrentFamily(data);
        return data;
      } else if (response.status === 404) {
        setCurrentFamily(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching current family:', error);
      setCurrentFamily(null);
      return null;
    }
  };

  const getResidentStats = (residentId: string) => {
    const records = careRecords.filter(r => r.residentId === residentId);
    const lastRecord = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return {
      totalRecords: records.length,
      lastRecordDate: lastRecord ? new Date(lastRecord.date) : null,
    };
  };

  // 年と月の選択肢を生成する関数
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // 現在年から-100年まで
    for (let year = currentYear; year >= currentYear - 100; year--) {
      years.push(year);
    }
    return years;
  };

  const generateMonthOptions = () => {
    return [
      { value: 0, label: '1月' },
      { value: 1, label: '2月' },
      { value: 2, label: '3月' },
      { value: 3, label: '4月' },
      { value: 4, label: '5月' },
      { value: 5, label: '6月' },
      { value: 6, label: '7月' },
      { value: 7, label: '8月' },
      { value: 8, label: '9月' },
      { value: 9, label: '10月' },
      { value: 10, label: '11月' },
      { value: 11, label: '12月' },
    ];
  };


  const handleAddResident = async () => {
    if (!newResident.name.trim()) {
      toast.error('名前を入力してください');
      return;
    }

    if (!newResident.familyName.trim()) {
      toast.error('家族名を入力してください');
      return;
    }

    if (!newResident.familyEmail.trim()) {
      toast.error('家族のメールアドレスを入力してください');
      return;
    }

    try {
      const response = await fetch('/api/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newResident.name.trim(),
          birthday: newResident.birthday.toISOString(),
          familyName: newResident.familyName.trim(),
          familyEmail: newResident.familyEmail.trim(),
          familyPhone: newResident.familyPhone.trim(),
          familyRelation: newResident.familyRelation.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add resident');
      }

      const resident = await response.json();
      setResidents((prev: any[]) => [resident, ...prev]);
      setNewResident({ 
        name: '', 
        birthday: new Date(),
        familyName: '',
        familyEmail: '',
        familyPhone: '',
        familyRelation: '',
      });
      setNewResidentDateOpen(false);
      setAddDialogOpen(false);
      toast.success('入居者と家族情報を追加しました');
    } catch (error) {
      console.error('Error adding resident:', error);
      const errorMessage = error instanceof Error ? error.message : '入居者の追加に失敗しました';
      toast.error(errorMessage);
    }
  };

  const handleEditResident = async () => {
    if (!selectedResident || !selectedResident.name.trim()) {
      toast.error('名前を入力してください');
      return;
    }

    try {
      const response = await fetch(`/api/residents/${selectedResident.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedResident.name.trim(),
          birthday: selectedResident.birthday.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update resident');
      }

      const updatedResident = await response.json();
      setResidents((prev: any[]) =>
        prev.map((r: any) =>
          r.id === selectedResident.id ? updatedResident : r
        )
      );
      
      setEditDialogOpen(false);
      setEditResidentDateOpen(false);
      setSelectedResident(null);
      toast.success('入居者情報を更新しました');
    } catch (error) {
      console.error('Error updating resident:', error);
      toast.error('入居者情報の更新に失敗しました');
    }
  };

  const handleUpdateFamilyRelationship = async (familyUserId: string) => {
    if (!selectedResident) return;

    try {
      const response = await fetch(`/api/residents/${selectedResident.id}/family`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyUserId: familyUserId,
        }),
      });

      if (response.ok) {
        const updatedFamily = await response.json();
        setCurrentFamily(updatedFamily);
        toast.success('家族関係を更新しました');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '家族関係の更新に失敗しました');
      }
    } catch (error) {
      console.error('Error updating family relationship:', error);
      toast.error('家族関係の更新に失敗しました');
    }
  };

  const openEditDialog = async (resident: any) => {
    const birthday = resident.birthday instanceof Date ? resident.birthday : new Date(resident.birthday);
    setSelectedResident({ 
      ...resident, 
      birthday: birthday
    });
    setEditResidentCalendarMonth(birthday);
    
    // 家族ユーザーと現在の家族関係を取得
    await fetchFamilyUsers();
    await fetchCurrentFamily(resident.id);
    
    setEditDialogOpen(true);
  };

  const handleDeleteResident = async (residentId: string) => {
    if (!confirm('この入居者を削除しますか？関連するデータも削除されます。')) {
      return;
    }

    try {
      const response = await fetch(`/api/residents/${residentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resident');
      }

      setResidents((prev: any[]) => prev.filter((r: any) => r.id !== residentId));
      toast.success('入居者を削除しました');
    } catch (error) {
      console.error('Error deleting resident:', error);
      toast.error('入居者の削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">入居者管理</h1>
          <p className="text-muted-foreground">
            入居者の基本情報を管理します
          </p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setNewResidentCalendarMonth(new Date());
            }}>
              <Plus className="h-4 w-4 mr-2" />
              入居者を追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しい入居者の追加</DialogTitle>
              <DialogDescription>
                入居者の基本情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">氏名</Label>
                <Input
                  id="name"
                  placeholder="例: 田中 花子"
                  value={newResident.name}
                  onChange={(e) => setNewResident(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>生年月日</Label>
                <Popover open={newResidentDateOpen} onOpenChange={(open) => {
                  console.log('Popover open state changed:', open);
                  setNewResidentDateOpen(open);
                }} modal={false}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        console.log('Button clicked, current state:', newResidentDateOpen);
                        setNewResidentDateOpen(!newResidentDateOpen);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newResident.birthday instanceof Date 
                        ? format(newResident.birthday, 'yyyy年MM月dd日', { locale: ja })
                        : '日付を選択してください'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-0" 
                    align="start" 
                    side="bottom" 
                    sideOffset={5} 
                    avoidCollisions={false}
                    style={{ position: 'fixed' }}
                  >
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">生年月日を選択</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewResidentDateOpen(false)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 mb-1 block">年</Label>
                          <Select
                            value={newResidentCalendarMonth.getFullYear().toString()}
                            onValueChange={(year) => {
                              const newDate = new Date(newResidentCalendarMonth);
                              newDate.setFullYear(parseInt(year));
                              setNewResidentCalendarMonth(newDate);
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 w-24">
                              <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {generateYearOptions().map((year) => (
                                  <SelectItem 
                                    key={year} 
                                    value={year.toString()}
                                    className={`text-center ${
                                      year === newResidentCalendarMonth.getFullYear() 
                                        ? 'bg-blue-50 text-blue-600 font-medium' 
                                        : ''
                                    }`}
                                  >
                                    {year}年
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 mb-1 block">月</Label>
                          <Select
                            value={newResidentCalendarMonth.getMonth().toString()}
                            onValueChange={(month) => {
                              const newDate = new Date(newResidentCalendarMonth);
                              newDate.setMonth(parseInt(month));
                              setNewResidentCalendarMonth(newDate);
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {generateMonthOptions().map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={newResident.birthday}
                        onSelect={(date) => {
                          console.log('Date selected:', date);
                          if (date) {
                            setNewResident(prev => ({ ...prev, birthday: date }));
                            setNewResidentDateOpen(false);
                          }
                        }}
                        month={newResidentCalendarMonth}
                        onMonthChange={setNewResidentCalendarMonth}
                        initialFocus
                        className="w-full"
                        showOutsideDays={false}
                        fixedWeeks={true}
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-3",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse",
                          head_row: "flex",
                          head_cell: "text-gray-500 rounded-md w-9 font-normal text-xs text-center",
                          row: "flex w-full",
                          cell: "text-center text-sm p-0 relative w-9 h-9 flex items-center justify-center [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md flex items-center justify-center",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                          day_today: "bg-gray-100 text-gray-900",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-300",
                          day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-600",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 家族情報セクション */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-lg font-medium mb-3">家族情報</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    入居者の家族情報を入力してください。家族がアプリに登録する際の照合に使用されます。
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyName">家族名 *</Label>
                    <Input
                      id="familyName"
                      placeholder="例: 田中 太郎"
                      value={newResident.familyName}
                      onChange={(e) => setNewResident(prev => ({ ...prev, familyName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="familyEmail">メールアドレス *</Label>
                    <Input
                      id="familyEmail"
                      type="email"
                      placeholder="例: tanaka@example.com"
                      value={newResident.familyEmail}
                      onChange={(e) => setNewResident(prev => ({ ...prev, familyEmail: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="familyPhone">電話番号</Label>
                    <Input
                      id="familyPhone"
                      placeholder="例: 090-1234-5678"
                      value={newResident.familyPhone}
                      onChange={(e) => setNewResident(prev => ({ ...prev, familyPhone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="familyRelation">続柄</Label>
                    <Select value={newResident.familyRelation} onValueChange={(value) => setNewResident(prev => ({ ...prev, familyRelation: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="続柄を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="配偶者">配偶者</SelectItem>
                        <SelectItem value="子">子</SelectItem>
                        <SelectItem value="親">親</SelectItem>
                        <SelectItem value="兄弟姉妹">兄弟姉妹</SelectItem>
                        <SelectItem value="孫">孫</SelectItem>
                        <SelectItem value="その他">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setAddDialogOpen(false);
                  setNewResidentDateOpen(false);
                }}>
                  キャンセル
                </Button>
                <Button onClick={handleAddResident}>
                  追加
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総入居者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{residents.length}</div>
            <p className="text-xs text-muted-foreground">
              管理中の入居者
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均年齢</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                residents.reduce((sum, r) => {
                  const birthYear = r.birthday instanceof Date 
                    ? r.birthday.getFullYear() 
                    : new Date(r.birthday).getFullYear();
                  return sum + (new Date().getFullYear() - birthYear);
                }, 0) / residents.length
              )}歳
            </div>
            <p className="text-xs text-muted-foreground">
              全入居者の平均
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">記録済み</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {careRecords.length}
            </div>
            <p className="text-xs text-muted-foreground">
              総記録数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 入居者一覧テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>入居者一覧</CardTitle>
          <CardDescription>
            現在登録されている入居者の一覧です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">読み込み中...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>年齢</TableHead>
                  <TableHead>生年月日</TableHead>
                  <TableHead>記録数</TableHead>
                  <TableHead>最終記録日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((resident) => {
                  const stats = getResidentStats(resident.id);
                  const age = new Date().getFullYear() - (resident.birthday instanceof Date 
                    ? resident.birthday.getFullYear() 
                    : new Date(resident.birthday).getFullYear());
                
                return (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">
                      {resident.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{age}歳</Badge>
                    </TableCell>
                    <TableCell>
                      {resident.birthday instanceof Date 
                        ? format(resident.birthday, 'yyyy年MM月dd日', { locale: ja })
                        : format(new Date(resident.birthday), 'yyyy年MM月dd日', { locale: ja })
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        {stats.totalRecords}件
                      </div>
                    </TableCell>
                    <TableCell>
                      {stats.lastRecordDate ? (
                        <Badge variant="outline">
                          {format(stats.lastRecordDate, 'MM月dd日', { locale: ja })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">記録なし</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(resident)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          編集
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteResident(resident.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>入居者情報の編集</DialogTitle>
            <DialogDescription>
              入居者の基本情報を更新します
            </DialogDescription>
          </DialogHeader>
          {selectedResident && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">氏名</Label>
                <Input
                  id="edit-name"
                  value={selectedResident.name}
                  onChange={(e) => setSelectedResident(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>生年月日</Label>
                <Popover open={editResidentDateOpen} onOpenChange={(open) => {
                  console.log('Edit Popover open state changed:', open);
                  setEditResidentDateOpen(open);
                }} modal={false}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        console.log('Edit Button clicked, current state:', editResidentDateOpen);
                        setEditResidentDateOpen(!editResidentDateOpen);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedResident.birthday instanceof Date 
                        ? format(selectedResident.birthday, 'yyyy年MM月dd日', { locale: ja })
                        : '日付を選択してください'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-0" 
                    align="start" 
                    side="bottom" 
                    sideOffset={5} 
                    avoidCollisions={false}
                    style={{ position: 'fixed' }}
                  >
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">生年月日を選択</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditResidentDateOpen(false)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 mb-1 block">年</Label>
                          <Select
                            value={editResidentCalendarMonth.getFullYear().toString()}
                            onValueChange={(year) => {
                              const newDate = new Date(editResidentCalendarMonth);
                              newDate.setFullYear(parseInt(year));
                              setEditResidentCalendarMonth(newDate);
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 w-24">
                              <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {generateYearOptions().map((year) => (
                                  <SelectItem 
                                    key={year} 
                                    value={year.toString()}
                                    className={`text-center ${
                                      year === editResidentCalendarMonth.getFullYear() 
                                        ? 'bg-blue-50 text-blue-600 font-medium' 
                                        : ''
                                    }`}
                                  >
                                    {year}年
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 mb-1 block">月</Label>
                          <Select
                            value={editResidentCalendarMonth.getMonth().toString()}
                            onValueChange={(month) => {
                              const newDate = new Date(editResidentCalendarMonth);
                              newDate.setMonth(parseInt(month));
                              setEditResidentCalendarMonth(newDate);
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {generateMonthOptions().map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={selectedResident.birthday}
                        onSelect={(date) => {
                          console.log('Edit Date selected:', date);
                          if (date) {
                            setSelectedResident(prev => prev ? { ...prev, birthday: date } : null);
                            setEditResidentDateOpen(false);
                          }
                        }}
                        month={editResidentCalendarMonth}
                        onMonthChange={setEditResidentCalendarMonth}
                        initialFocus
                        className="w-full"
                        showOutsideDays={false}
                        fixedWeeks={true}
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-3",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse",
                          head_row: "flex",
                          head_cell: "text-gray-500 rounded-md w-9 font-normal text-xs text-center",
                          row: "flex w-full",
                          cell: "text-center text-sm p-0 relative w-9 h-9 flex items-center justify-center [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md flex items-center justify-center",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                          day_today: "bg-gray-100 text-gray-900",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-300",
                          day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-600",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 家族関係設定セクション */}
              <div className="space-y-2">
                <Label>家族関係設定</Label>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">現在の家族</Label>
                      {currentFamily ? (
                        <div className="mt-1 p-2 bg-white border rounded">
                          <div className="text-sm">
                            <span className="font-medium">{currentFamily.user.name}</span>
                            <span className="text-gray-500 ml-2">({currentFamily.user.email})</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 p-2 bg-white border rounded text-gray-500 text-sm">
                          家族が設定されていません
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">家族を変更</Label>
                      <Select onValueChange={handleUpdateFamilyRelationship}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="家族ユーザーを選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {familyUsers.map((family) => (
                            <SelectItem key={family.id} value={family.id}>
                              {family.name} ({family.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  setEditResidentDateOpen(false);
                }}>
                  キャンセル
                </Button>
                <Button onClick={handleEditResident}>
                  更新
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}