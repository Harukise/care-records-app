import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalendarIcon, Activity, Utensils, Bath, Pill, Thermometer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useSession } from 'next-auth/react';

export function ReportView() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [dateRange, setDateRange] = useState('today');
  const [residents, setResidents] = useState<any[]>([]);
  const [careRecords, setCareRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 入居者一覧を取得
        const residentsResponse = await fetch('/api/residents');
        if (residentsResponse.ok) {
          const residentsData = await residentsResponse.json();
          setResidents(residentsData);
          
          // 最初の入居者を選択
          if (residentsData.length > 0) {
            setSelectedResident(residentsData[0].id);
          }
        }

        // 介護記録を取得
        const recordsResponse = await fetch('/api/care-records');
        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          setCareRecords(recordsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredRecords = () => {
    if (!selectedResident) return [];
    
    let records = careRecords.filter(record => record.residentId === selectedResident);
    
    if (dateRange === 'today' && selectedDate) {
      records = records.filter(record => 
        new Date(record.date).toDateString() === selectedDate.toDateString()
      );
    } else if (dateRange === 'week' && selectedDate) {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - 7);
      records = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekStart && recordDate <= selectedDate;
      });
    }
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const selectedResidentData = residents.find(r => r.id === selectedResident);
  const filteredRecords = getFilteredRecords();

  const getVitalStatus = (vital: string) => {
    if (vital.includes('37.') || vital.includes('38.')) {
      return { status: '注意', variant: 'destructive' as const };
    }
    return { status: '正常', variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">介護レポート</h1>
        <p className="text-muted-foreground">
          日々の介護記録を確認できます
        </p>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>表示設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">入居者選択</label>
              <Select value={selectedResident} onValueChange={setSelectedResident}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "読み込み中..." : "入居者を選択"} />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">期間</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">指定日</SelectItem>
                  <SelectItem value="week">過去1週間</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">基準日</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, 'MM月dd日', { locale: ja })
                    ) : (
                      <span>日付を選択</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 入居者情報 */}
      {selectedResidentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {selectedResidentData.name}さんの情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">年齢</p>
                <p className="font-medium">
                  {new Date().getFullYear() - new Date(selectedResidentData.birthday).getFullYear()}歳
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">生年月日</p>
                <p className="font-medium">
                  {format(new Date(selectedResidentData.birthday), 'yyyy年MM月dd日', { locale: ja })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">記録数</p>
                <p className="font-medium">{filteredRecords.length}件</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 記録一覧 */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">記録がありません</p>
                <p className="text-muted-foreground">
                  選択した期間に記録がありません
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => {
            const staff = record.staff;
            const vitalStatus = getVitalStatus(record.vital || '');
            
            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {format(new Date(record.date), 'yyyy年MM月dd日', { locale: ja })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={vitalStatus.variant}>
                        {vitalStatus.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        記録者: {staff?.name || '不明'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 食事 */}
                  <div className="flex items-start gap-3">
                    <Utensils className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">食事</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {record.meal || '記録なし'}
                      </p>
                    </div>
                  </div>

                  {/* 入浴 */}
                  <div className="flex items-start gap-3">
                    <Bath className="h-5 w-5 text-cyan-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">入浴・清潔ケア</h4>
                      <p className="text-sm text-muted-foreground">
                        {record.bath || '記録なし'}
                      </p>
                    </div>
                  </div>

                  {/* 排泄 */}
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">排泄</h4>
                      <p className="text-sm text-muted-foreground">
                        {record.toilet || '記録なし'}
                      </p>
                    </div>
                  </div>

                  {/* 服薬 */}
                  <div className="flex items-start gap-3">
                    <Pill className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">服薬</h4>
                      <p className="text-sm text-muted-foreground">
                        {record.medicine || '記録なし'}
                      </p>
                    </div>
                  </div>

                  {/* バイタル */}
                  <div className="flex items-start gap-3">
                    <Thermometer className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">バイタルサイン</h4>
                      <p className="text-sm text-muted-foreground">
                        {record.vital || '記録なし'}
                      </p>
                    </div>
                  </div>

                  {/* 特記事項 */}
                  {record.note && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">特記事項・連絡事項</h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {record.note}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      記録日時: {format(new Date(record.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}