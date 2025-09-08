import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Camera, Upload, Image as ImageIcon, Calendar, User, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function PhotoGallery() {
  const { data: session } = useSession();
  const [selectedResident, setSelectedResident] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResident, setUploadResident] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editCaption, setEditCaption] = useState('');
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<any>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 写真データと入居者データを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [photosResponse, residentsResponse] = await Promise.all([
          fetch('/api/photos'),
          fetch('/api/residents')
        ]);

        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          setPhotos(photosData);
        } else {
          toast.error('写真データの取得に失敗しました');
        }

        if (residentsResponse.ok) {
          const residentsData = await residentsResponse.json();
          setResidents(residentsData);
        } else {
          toast.error('入居者データの取得に失敗しました');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredPhotos = () => {
    if (selectedResident === 'all') {
      return photos;
    }
    return photos.filter(photo => photo.residentId === selectedResident);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB制限
        toast.error('ファイルサイズは5MB以下にしてください');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('画像ファイルを選択してください');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadResident) {
      toast.error('ファイルと入居者を選択してください');
      return;
    }

    setUploading(true);

    try {
      // まずファイルをアップロード
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('residentId', uploadResident);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        
        // 写真情報をデータベースに保存
        const photoResponse = await fetch('/api/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            residentId: uploadResident,
            url: uploadData.url,
            caption: '', // 必要に応じてキャプション入力フィールドを追加
          }),
        });

        if (photoResponse.ok) {
          const newPhoto = await photoResponse.json();
          setPhotos(prev => [newPhoto, ...prev]);
          toast.success('写真をアップロードしました');
          setUploadDialogOpen(false);
          setSelectedFile(null);
          setUploadResident('');
        } else {
          toast.error('写真の保存に失敗しました');
        }
      } else {
        toast.error('ファイルのアップロードに失敗しました');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('写真のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  // 編集ダイアログを開く
  const openEditDialog = (photo: any) => {
    setEditingPhoto(photo);
    setEditCaption(photo.caption || '');
    setEditDialogOpen(true);
  };

  // 編集ダイアログを閉じる
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingPhoto(null);
    setEditCaption('');
  };

  // キャプションを更新
  const handleUpdateCaption = async () => {
    if (!editingPhoto) return;

    try {
      const response = await fetch(`/api/photos/${editingPhoto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: editCaption,
        }),
      });

      if (response.ok) {
        const updatedPhoto = await response.json();
        setPhotos(prev => prev.map(photo => 
          photo.id === editingPhoto.id ? updatedPhoto : photo
        ));
        toast.success('キャプションを更新しました');
        closeEditDialog();
      } else {
        toast.error('キャプションの更新に失敗しました');
      }
    } catch (error) {
      console.error('Error updating caption:', error);
      toast.error('キャプションの更新に失敗しました');
    }
  };

  // 画像アップロードダイアログを開く
  const openImageUploadDialog = (photo: any) => {
    setUploadingPhoto(photo);
    setNewImageFile(null);
    setImageUploadDialogOpen(true);
  };

  // 画像アップロードダイアログを閉じる
  const closeImageUploadDialog = () => {
    setImageUploadDialogOpen(false);
    setUploadingPhoto(null);
    setNewImageFile(null);
  };

  // 新しい画像ファイルを選択
  const handleNewImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewImageFile(file);
    }
  };

  // 画像を更新
  const handleUpdateImage = async () => {
    if (!uploadingPhoto || !newImageFile) return;

    setUploadingImage(true);
    try {
      // 新しい画像をアップロード
      const formData = new FormData();
      formData.append('file', newImageFile);
      formData.append('residentId', uploadingPhoto.residentId);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        
        // 写真のURLを更新
        const updateResponse = await fetch(`/api/photos/${uploadingPhoto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: uploadData.url,
          }),
        });

        if (updateResponse.ok) {
          const updatedPhoto = await updateResponse.json();
          setPhotos(prev => prev.map(photo => 
            photo.id === uploadingPhoto.id ? updatedPhoto : photo
          ));
          toast.success('画像を更新しました');
          closeImageUploadDialog();
        } else {
          toast.error('画像の更新に失敗しました');
        }
      } else {
        toast.error('ファイルのアップロードに失敗しました');
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('画像の更新に失敗しました');
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredPhotos = getFilteredPhotos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">写真ギャラリー</h1>
          <p className="text-muted-foreground">
            {session?.user?.role === 'STAFF' ? '写真の投稿・管理ができます' : '投稿された写真を確認できます'}
          </p>
        </div>
        
        {session?.user?.role === 'STAFF' && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                写真をアップロード
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>写真アップロード</DialogTitle>
                <DialogDescription>
                  入居者の写真をアップロードします
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resident-select">入居者選択</Label>
                  <Select value={uploadResident} onValueChange={setUploadResident}>
                    <SelectTrigger>
                      <SelectValue placeholder="入居者を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>
                          入居者データを読み込み中...
                        </SelectItem>
                      ) : (
                        residents.map((resident) => (
                          <SelectItem key={resident.id} value={resident.id}>
                            {resident.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file-upload">写真ファイル</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      選択されたファイル: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadDialogOpen(false)}
                    disabled={uploading}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile || !uploadResident}
                  >
                    {uploading ? 'アップロード中...' : 'アップロード'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>表示設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>入居者フィルター</Label>
              <Select value={selectedResident} onValueChange={setSelectedResident}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての入居者</SelectItem>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      入居者データを読み込み中...
                    </SelectItem>
                  ) : (
                    residents.map((resident) => (
                      <SelectItem key={resident.id} value={resident.id}>
                        {resident.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 写真グリッド */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">写真データを読み込み中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">写真がありません</p>
                    <p className="text-muted-foreground">
                      {session?.user?.role === 'STAFF' ? '写真をアップロードしてください' : '写真が投稿されるとここに表示されます'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredPhotos.map((photo) => {
              const resident = residents.find(r => r.id === photo.residentId);
              const uploader = photo.user;
            
            return (
              <Card key={photo.id} className="overflow-hidden">
                <div 
                  className="aspect-square relative cursor-pointer group"
                  onClick={() => session?.user?.role === 'STAFF' && openImageUploadDialog(photo)}
                >
                  <ImageWithFallback
                    src={photo.url}
                    alt={photo.caption || '入居者の写真'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {session?.user?.role === 'STAFF' && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white bg-opacity-90 rounded-full p-2">
                          <Upload className="h-6 w-6 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{resident?.name}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(photo.createdAt, 'MM月dd日', { locale: ja })}
                    </p>
                  </div>
                  
                  {photo.caption && (
                    <p className="text-sm mb-3">{photo.caption}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>投稿者: {uploader?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(photo.createdAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span>
                  </div>
                  
                  {session?.user?.role === 'STAFF' && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(photo)}
                        className="w-full"
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        キャプションを編集
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
        </div>
      )}

      {/* 写真が多い場合の統計情報 */}
      {filteredPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              ギャラリー統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{filteredPhotos.length}</p>
                <p className="text-sm text-muted-foreground">写真数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedResident === 'all' ? residents.length : 1}
                </p>
                <p className="text-sm text-muted-foreground">対象入居者</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {format(new Date(), 'MM月', { locale: ja })}
                </p>
                <p className="text-sm text-muted-foreground">今月の投稿</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>キャプションを編集</DialogTitle>
            <DialogDescription>
              写真のキャプションを編集できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingPhoto && (
              <div className="space-y-2">
                <Label htmlFor="edit-caption">キャプション</Label>
                <Input
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="キャプションを入力してください"
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeEditDialog}>
                キャンセル
              </Button>
              <Button onClick={handleUpdateCaption}>
                更新
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 画像アップロードダイアログ */}
      <Dialog open={imageUploadDialogOpen} onOpenChange={setImageUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>画像を更新</DialogTitle>
            <DialogDescription>
              新しい画像をアップロードして写真を更新します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {uploadingPhoto && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-image-file">新しい画像ファイル</Label>
                  <Input
                    id="new-image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleNewImageSelect}
                  />
                  {newImageFile && (
                    <p className="text-sm text-muted-foreground">
                      選択されたファイル: {newImageFile.name}
                    </p>
                  )}
                </div>
                
                {newImageFile && (
                  <div className="space-y-2">
                    <Label>プレビュー</Label>
                    <div className="border rounded-lg p-4">
                      <img
                        src={URL.createObjectURL(newImageFile)}
                        alt="プレビュー"
                        className="max-w-full max-h-48 object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeImageUploadDialog}>
                キャンセル
              </Button>
              <Button 
                onClick={handleUpdateImage}
                disabled={!newImageFile || uploadingImage}
              >
                {uploadingImage ? '更新中...' : '画像を更新'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}