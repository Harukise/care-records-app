import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Edit, Trash2, Eye, Calendar as CalendarIcon, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';

interface CareRecord {
  id: string;
  date: string;
  meal?: string;
  bath?: string;
  toilet?: string;
  medicine?: string;
  vital?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  resident: {
    id: string;
    name: string;
  };
  staff: {
    id: string;
    name: string;
  };
}

interface Resident {
  id: string;
  name: string;
}

export function CareRecordsList() {
  const [careRecords, setCareRecords] = useState<CareRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CareRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    meal: '',
    bath: '',
    toilet: '',
    medicine: '',
    vital: '',
    note: '',
  });
  const [filters, setFilters] = useState({
    residentId: '',
    recordDate: '',
  });

  // 介護記録を取得
  const fetchCareRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.residentId) params.append('residentId', filters.residentId);
      if (filters.recordDate) params.append('date', filters.recordDate);

      const response = await fetch(`/api/care-records?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCareRecords(data);
      }
    } catch (error) {
      console.error('Error fetching care records:', error);
      toast.error('介護記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 入居者を取得
  const fetchResidents = async () => {
    try {
      const response = await fetch('/api/residents');
      if (response.ok) {
        const data = await response.json();
        setResidents(data);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  useEffect(() => {
    fetchCareRecords();
    fetchResidents();
  }, []);

  // フィルター変更時に再取得
  useEffect(() => {
    fetchCareRecords();
  }, [filters]);

  const openEditDialog = (record: CareRecord) => {
    setSelectedRecord(record);
    setEditFormData({
      meal: record.meal || '',
      bath: record.bath || '',
      toilet: record.toilet || '',
      medicine: record.medicine || '',
      vital: record.vital || '',
      note: record.note || '',
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (record: CareRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedRecord) return;

    try {
      const response = await fetch(`/api/care-records/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to update care record');
      }

      const updatedRecord = await response.json();
      setCareRecords(prev => 
        prev.map(record => 
          record.id === selectedRecord.id ? updatedRecord : record
        )
      );
      
      setEditDialogOpen(false);
      setSelectedRecord(null);
      toast.success('介護記録を更新しました');
    } catch (error) {
      console.error('Error updating care record:', error);
      toast.error('介護記録の更新に失敗しました');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('この介護記録を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/care-records/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete care record');
      }

      setCareRecords(prev => prev.filter(record => record.id !== recordId));
      toast.success('介護記録を削除しました');
    } catch (error) {
      console.error('Error deleting care record:', error);
      toast.error('介護記録の削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">介護記録一覧</h1>
        <p className="text-muted-foreground">
          作成された介護記録の一覧と管理
        </p>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>入居者</Label>
              <Select 
                value={filters.residentId || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, residentId: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全入居者" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全入居者</SelectItem>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>記録日</Label>
              <Input
                type="date"
                value={filters.recordDate}
                onChange={(e) => setFilters(prev => ({ ...prev, recordDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 介護記録一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>介護記録一覧</CardTitle>
          <CardDescription>
            {careRecords.length}件の記録が見つかりました
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
                  <TableHead>日付</TableHead>
                  <TableHead>入居者</TableHead>
                  <TableHead>スタッフ</TableHead>
                  <TableHead>食事</TableHead>
                  <TableHead>入浴</TableHead>
                  <TableHead>バイタル</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {careRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(record.date), 'MM月dd日', { locale: ja })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {record.resident.name}
                      </div>
                    </TableCell>
                    <TableCell>{record.staff.name}</TableCell>
                    <TableCell>
                      {record.meal ? (
                        <Badge variant="outline" className="max-w-32 truncate">
                          {record.meal.slice(0, 20)}...
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未記入</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.bath ? (
                        <Badge variant="outline" className="max-w-32 truncate">
                          {record.bath.slice(0, 20)}...
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未記入</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.vital ? (
                        <Badge variant="outline" className="max-w-32 truncate">
                          {record.vital.slice(0, 20)}...
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未記入</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(record)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          詳細
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(record)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          編集
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 詳細表示ダイアログ */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>介護記録詳細</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  {selectedRecord.resident.name} - {format(new Date(selectedRecord.date), 'yyyy年MM月dd日', { locale: ja })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>食事記録</Label>
                  <div className="p-3 bg-gray-50 rounded-md min-h-20">
                    {selectedRecord.meal || '記録なし'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>入浴記録</Label>
                  <div className="p-3 bg-gray-50 rounded-md min-h-20">
                    {selectedRecord.bath || '記録なし'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>排泄記録</Label>
                  <div className="p-3 bg-gray-50 rounded-md min-h-20">
                    {selectedRecord.toilet || '記録なし'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>服薬記録</Label>
                  <div className="p-3 bg-gray-50 rounded-md min-h-20">
                    {selectedRecord.medicine || '記録なし'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>バイタルサイン</Label>
                  <div className="p-3 bg-gray-50 rounded-md min-h-20">
                    {selectedRecord.vital || '記録なし'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>特記事項</Label>
                  <div className="p-3 bg-gray-50 rounded-md min-h-20">
                    {selectedRecord.note || '記録なし'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>介護記録の編集</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  {selectedRecord.resident.name} - {format(new Date(selectedRecord.date), 'yyyy年MM月dd日', { locale: ja })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>食事記録</Label>
                  <Textarea
                    value={editFormData.meal}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, meal: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>入浴記録</Label>
                  <Textarea
                    value={editFormData.bath}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, bath: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>排泄記録</Label>
                  <Textarea
                    value={editFormData.toilet}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, toilet: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>服薬記録</Label>
                  <Textarea
                    value={editFormData.medicine}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, medicine: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>バイタルサイン</Label>
                  <Input
                    value={editFormData.vital}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, vital: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>特記事項</Label>
                  <Textarea
                    value={editFormData.note}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleEditSubmit}>
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
