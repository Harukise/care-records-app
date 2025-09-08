import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Save, Plus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';

export function CareRecordForm() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedResident, setSelectedResident] = useState('');
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    meal: '',
    bath: '',
    toilet: '',
    medicine: '',
    vital: '',
    note: '',
  });

  // 入居者データをAPIから取得
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

  useEffect(() => {
    fetchResidents();
  }, []);

  // ページがフォーカスされた時にデータを再取得
  useEffect(() => {
    const handleFocus = () => {
      fetchResidents();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedResident) {
      toast.error('入居者を選択してください');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/care-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          residentId: selectedResident,
          date: selectedDate.toISOString(),
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save care record');
      }

      const savedRecord = await response.json();
      console.log('記録を保存しました:', savedRecord);
      toast.success('介護記録を保存しました');
      
      // フォームをリセット
      setFormData({
        meal: '',
        bath: '',
        toilet: '',
        medicine: '',
        vital: '',
        note: '',
      });
    } catch (error) {
      console.error('Error saving care record:', error);
      toast.error('介護記録の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const quickFillTemplates = {
    meal: [
      '朝食：完食、昼食：完食、夕食：完食',
      '朝食：8割摂取、昼食：完食、夕食：9割摂取',
      '食事制限により軟食対応',
    ],
    bath: [
      '入浴済み（温度38℃、時間15分）',
      '清拭のみ実施',
      'シャワー浴実施',
    ],
    toilet: [
      '排尿：正常、排便：1回',
      '排尿：正常、排便：なし',
      'おむつ交換：3回実施',
    ],
    medicine: [
      '処方薬すべて服用済み',
      '血圧薬のみ服用（朝・夕）',
      '服薬拒否のため家族に連絡',
    ],
    vital: [
      '体温36.5℃、血圧120/80、脈拍72',
      '体温37.0℃、血圧130/85、脈拍78',
      '体温36.2℃、血圧110/70、脈拍65',
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">介護記録入力</h1>
        <p className="text-muted-foreground">
          日々の介護記録を入力してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>記録対象と日付を選択してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resident">入居者</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchResidents}
                    disabled={loading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <Select value={selectedResident} onValueChange={setSelectedResident} disabled={loading}>
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
                <Label>記録日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, 'yyyy年MM月dd日', { locale: ja })
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 食事記録 */}
        <Card>
          <CardHeader>
            <CardTitle>食事記録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal">食事内容・摂取量</Label>
              <Textarea
                id="meal"
                placeholder="朝食、昼食、夕食の摂取状況を記入してください"
                value={formData.meal}
                onChange={(e) => handleInputChange('meal', e.target.value)}
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                {quickFillTemplates.meal.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('meal', template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    テンプレート{index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 入浴記録 */}
        <Card>
          <CardHeader>
            <CardTitle>入浴記録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bath">入浴・清潔ケア</Label>
              <Textarea
                id="bath"
                placeholder="入浴の実施状況、温度、時間などを記入してください"
                value={formData.bath}
                onChange={(e) => handleInputChange('bath', e.target.value)}
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                {quickFillTemplates.bath.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('bath', template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {template.slice(0, 8)}...
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 排泄記録 */}
        <Card>
          <CardHeader>
            <CardTitle>排泄記録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="toilet">排泄状況</Label>
              <Textarea
                id="toilet"
                placeholder="排尿・排便の回数や状況を記入してください"
                value={formData.toilet}
                onChange={(e) => handleInputChange('toilet', e.target.value)}
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                {quickFillTemplates.toilet.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('toilet', template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {template.slice(0, 8)}...
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 服薬記録 */}
        <Card>
          <CardHeader>
            <CardTitle>服薬記録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicine">服薬状況</Label>
              <Textarea
                id="medicine"
                placeholder="処方薬の服用状況を記入してください"
                value={formData.medicine}
                onChange={(e) => handleInputChange('medicine', e.target.value)}
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                {quickFillTemplates.medicine.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('medicine', template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {template.slice(0, 8)}...
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* バイタル記録 */}
        <Card>
          <CardHeader>
            <CardTitle>バイタルサイン</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vital">体温・血圧・脈拍</Label>
              <Input
                id="vital"
                placeholder="体温36.5℃、血圧120/80、脈拍72"
                value={formData.vital}
                onChange={(e) => handleInputChange('vital', e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {quickFillTemplates.vital.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('vital', template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    テンプレート{index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 特記事項 */}
        <Card>
          <CardHeader>
            <CardTitle>特記事項・連絡事項</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">メモ・特記事項</Label>
              <Textarea
                id="note"
                placeholder="その他気づいたことや家族への連絡事項があれば記入してください"
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" className="min-w-32" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '記録を保存'}
          </Button>
        </div>
      </form>
    </div>
  );
}