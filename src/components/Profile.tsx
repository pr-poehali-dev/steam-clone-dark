import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface ProfileProps {
  user: any;
  onUpdate: (user: any) => void;
  onClose: () => void;
  onLogout: () => void;
}

export default function Profile({ user, onUpdate, onClose, onLogout }: ProfileProps) {
  const [editMode, setEditMode] = useState(false);
  const [userFrames, setUserFrames] = useState<any[]>([]);
  const [allFrames, setAllFrames] = useState<any[]>([]);
  const { toast } = useToast();

  const [editForm, setEditForm] = useState({
    username: user.username || '',
    display_name: user.display_name || '',
    avatar_url: user.avatar_url || ''
  });

  useEffect(() => {
    loadFrames();
    loadUserFrames();
  }, []);

  const loadFrames = () => {
    const frames = JSON.parse(localStorage.getItem('frames') || '[]');
    setAllFrames(frames);
  };

  const loadUserFrames = () => {
    const userFramesData = JSON.parse(localStorage.getItem('userFrames') || '{}');
    const myFrames = userFramesData[user.id] || [];
    setUserFrames(myFrames);
  };

  const purchaseFrame = (frame: any) => {
    if (user.balance < frame.price) {
      toast({ title: 'Недостаточно средств', variant: 'destructive' });
      return;
    }

    const userFramesData = JSON.parse(localStorage.getItem('userFrames') || '{}');
    if (!userFramesData[user.id]) userFramesData[user.id] = [];
    
    const alreadyOwned = userFramesData[user.id].some((f: any) => f.id === frame.id);
    if (alreadyOwned) {
      toast({ title: 'У вас уже есть эта рамка', variant: 'destructive' });
      return;
    }

    userFramesData[user.id].push(frame);
    localStorage.setItem('userFrames', JSON.stringify(userFramesData));

    const updated = { ...user, balance: user.balance - frame.price };
    localStorage.setItem('user', JSON.stringify(updated));
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => u.id === user.id ? updated : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    onUpdate(updated);

    loadUserFrames();
    toast({ title: 'Рамка куплена!' });
  };

  const setActiveFrame = (frameId: number) => {
    const updated = { ...user, active_frame_id: frameId };
    localStorage.setItem('user', JSON.stringify(updated));
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => u.id === user.id ? updated : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    onUpdate(updated);
    toast({ title: 'Рамка установлена' });
  };

  const updateProfile = () => {
    const updated = { ...user, ...editForm };
    localStorage.setItem('user', JSON.stringify(updated));
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => u.id === user.id ? updated : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    onUpdate(updated);
    setEditMode(false);
    toast({ title: 'Профиль обновлён' });
  };

  const purchasedGames = JSON.parse(localStorage.getItem('purchasedGames') || '{}')[user.id] || [];

  const activeFrame = userFrames.find(f => f.id === user.active_frame_id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Профиль</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Профиль</TabsTrigger>
            <TabsTrigger value="library" className="text-xs sm:text-sm">Библиотека</TabsTrigger>
            <TabsTrigger value="frames-shop" className="text-xs sm:text-sm">Рамки</TabsTrigger>
            <TabsTrigger value="my-frames" className="text-xs sm:text-sm">Мои рамки</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {(editMode ? editForm.avatar_url : user.avatar_url) ? (
                    <img src={editMode ? editForm.avatar_url : user.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="User" size={40} className="text-primary" />
                  )}
                </div>
                {activeFrame && (
                  <img 
                    src={activeFrame.image_url} 
                    alt="Frame" 
                    className="absolute inset-0 w-20 h-20 object-cover z-10 pointer-events-none"
                  />
                )}
              </div>
              <div className="flex-1">
                {!editMode ? (
                  <>
                    <h3 className="text-2xl font-bold">{user.display_name || user.username}</h3>
                    <p className="text-muted-foreground">@{user.username}</p>
                    <Button onClick={() => {
                      setEditForm({
                        username: user.username || '',
                        display_name: user.display_name || '',
                        avatar_url: user.avatar_url || ''
                      });
                      setEditMode(true);
                    }} variant="outline" size="sm" className="mt-2">
                      <Icon name="Edit" size={16} className="mr-2" />
                      Редактировать
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label>Имя пользователя</Label>
                      <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
                    </div>
                    <div>
                      <Label>Отображаемое имя</Label>
                      <Input value={editForm.display_name} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>URL аватара</Label>
                      <Input value={editForm.avatar_url} onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={updateProfile}>Сохранить</Button>
                      <Button onClick={() => setEditMode(false)} variant="outline">Отмена</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-2">
            {purchasedGames.map((game: any) => (
              <Card key={game.id} className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {game.logo_url && (
                    <img src={game.logo_url} alt={game.title} className="w-full sm:w-20 h-40 sm:h-20 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold">{game.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
                    <Button asChild size="sm" className="bg-green-600">
                      <a href={game.file_url} target="_blank">
                        <Icon name="Download" size={16} className="mr-2" />
                        Скачать
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {purchasedGames.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Нет купленных игр</p>
            )}
          </TabsContent>

          <TabsContent value="frames-shop" className="grid grid-cols-2 gap-4">
            {allFrames.map((frame) => (
              <Card key={frame.id} className="p-4">
                <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {frame.image_url ? (
                    <img src={frame.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="Image" size={32} className="text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-bold mb-2">{frame.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{frame.price === 0 ? 'Бесплатно' : `${frame.price} ₽`}</span>
                  <Button 
                    size="sm" 
                    onClick={() => purchaseFrame(frame)}
                    disabled={userFrames.some(f => f.id === frame.id)}
                  >
                    {userFrames.some(f => f.id === frame.id) ? 'Куплено' : 'Купить'}
                  </Button>
                </div>
              </Card>
            ))}
            {allFrames.length === 0 && (
              <p className="col-span-2 text-center text-muted-foreground py-8">Нет доступных рамок</p>
            )}
          </TabsContent>

          <TabsContent value="my-frames" className="grid grid-cols-2 gap-4">
            {userFrames.map((frame) => (
              <Card key={frame.id} className="p-4">
                <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {frame.image_url ? (
                    <img src={frame.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="Image" size={32} className="text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-bold mb-2">{frame.name}</h3>
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => setActiveFrame(frame.id)}
                  variant={user.active_frame_id === frame.id ? 'default' : 'outline'}
                >
                  {user.active_frame_id === frame.id ? 'Установлена' : 'Установить'}
                </Button>
              </Card>
            ))}
            {userFrames.length === 0 && (
              <p className="col-span-2 text-center text-muted-foreground py-8">Нет рамок</p>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Настройки аккаунта</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Баланс</p>
                    <p className="text-sm text-muted-foreground">{user.balance} ₽</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={onLogout} className="w-full">
                  <Icon name="LogOut" size={18} className="mr-2" />
                  Выйти из аккаунта
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}