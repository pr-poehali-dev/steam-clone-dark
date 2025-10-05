import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface ProfileProps {
  user: any;
  onUpdate: (user: any) => void;
  onClose: () => void;
}

export default function Profile({ user, onUpdate, onClose }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allFrames, setAllFrames] = useState<any[]>([]);
  const [userFrames, setUserFrames] = useState<any[]>([]);
  const { toast } = useToast();

  const [editForm, setEditForm] = useState({
    username: user.username || '',
    display_name: user.display_name || '',
    avatar_url: user.avatar_url || ''
  });

  useEffect(() => {
    fetchProfile();
    fetchFriends();
    fetchFrames();
    fetchUserFrames();
  }, []);

  const fetchFrames = async () => {
    const res = await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_frames' })
    });
    const data = await res.json();
    setAllFrames(data);
  };

  const fetchUserFrames = async () => {
    const res = await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_user_frames', user_id: user.id })
    });
    const data = await res.json();
    setUserFrames(data);
  };

  const purchaseFrame = async (frameId: number, price: number) => {
    const res = await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'purchase_frame', user_id: user.id, frame_id: frameId })
    });
    const data = await res.json();
    
    if (data.success) {
      const updated = { ...user, balance: data.new_balance };
      localStorage.setItem('user', JSON.stringify(updated));
      onUpdate(updated);
      fetchUserFrames();
      toast({ title: 'Рамка куплена!' });
    } else {
      toast({ title: data.error, variant: 'destructive' });
    }
  };

  const setActiveFrame = async (frameId: number) => {
    await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_active_frame', user_id: user.id, frame_id: frameId })
    });
    toast({ title: 'Рамка установлена' });
  };

  const fetchProfile = async () => {
    const res = await fetch(`https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191?user_id=${user.id}`);
    const data = await res.json();
    setProfile(data);
  };

  const fetchFriends = async () => {
    const res = await fetch(`https://functions.poehali.dev/1727bd49-5413-4e32-91b6-cee6fcffa3de?action=friends&user_id=${user.id}`);
    const data = await res.json();
    setFriends(data);
  };

  const searchUsers = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`https://functions.poehali.dev/1727bd49-5413-4e32-91b6-cee6fcffa3de?action=search&user_id=${user.id}&search=${query}`);
    const data = await res.json();
    setSearchResults(data);
  };

  const addFriend = async (friendId: number) => {
    await fetch('https://functions.poehali.dev/1727bd49-5413-4e32-91b6-cee6fcffa3de', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_friend', user_id: user.id, friend_id: friendId })
    });
    fetchFriends();
    toast({ title: 'Друг добавлен' });
  };

  const loadMessages = async (friendId: number) => {
    const res = await fetch(`https://functions.poehali.dev/1727bd49-5413-4e32-91b6-cee6fcffa3de?action=messages&user_id=${user.id}&friend_id=${friendId}`);
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = async () => {
    if (!newMessage || !selectedFriend) return;
    
    await fetch('https://functions.poehali.dev/1727bd49-5413-4e32-91b6-cee6fcffa3de', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_message', sender_id: user.id, receiver_id: selectedFriend.id, message: newMessage })
    });
    
    setNewMessage('');
    loadMessages(selectedFriend.id);
  };

  const updateProfile = async () => {
    await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, ...editForm })
    });
    
    const updated = { ...user, ...editForm };
    localStorage.setItem('user', JSON.stringify(updated));
    onUpdate(updated);
    setEditMode(false);
    fetchProfile();
    toast({ title: 'Профиль обновлён' });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Профиль</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="friends">Друзья</TabsTrigger>
            <TabsTrigger value="library">Библиотека</TabsTrigger>
            <TabsTrigger value="frames-shop">Рамки</TabsTrigger>
            <TabsTrigger value="my-frames">Мои рамки</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {editForm.avatar_url ? (
                  <img src={editForm.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="User" size={40} className="text-primary" />
                )}
              </div>
              <div className="flex-1">
                {!editMode ? (
                  <>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {profile?.display_name || profile?.username}
                      {profile?.is_verified && <Icon name="BadgeCheck" size={20} className="text-green-500" />}
                    </h3>
                    <p className="text-muted-foreground">@{profile?.username}</p>
                    <Button onClick={() => setEditMode(true)} variant="outline" size="sm" className="mt-2">
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

          <TabsContent value="friends" className="space-y-4">
            <Tabs defaultValue="list">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Мои друзья</TabsTrigger>
                <TabsTrigger value="search">Поиск друзей</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-2">
                {friends.map((friend) => (
                  <Card key={friend.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <Icon name="User" size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-1">
                          {friend.display_name || friend.username}
                          {friend.is_verified && <Icon name="BadgeCheck" size={16} className="text-green-500" />}
                        </p>
                        <p className="text-sm text-muted-foreground">@{friend.username}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => { setSelectedFriend(friend); loadMessages(friend.id); }}>
                      <Icon name="MessageCircle" size={16} />
                    </Button>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="search" className="space-y-2">
                <Input placeholder="Поиск пользователей..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value); }} />
                {searchResults.map((user) => (
                  <Card key={user.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <Icon name="User" size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-1">
                          {user.display_name || user.username}
                          {user.is_verified && <Icon name="BadgeCheck" size={16} className="text-green-500" />}
                        </p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => addFriend(user.id)}>
                      <Icon name="UserPlus" size={16} />
                    </Button>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="library" className="space-y-2">
            {profile?.purchases?.map((game: any) => (
              <Card key={game.id} className="p-4">
                <h3 className="font-bold">{game.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
                <Button asChild size="sm" className="bg-green-600">
                  <a href={game.file_url} target="_blank">
                    <Icon name="Download" size={16} className="mr-2" />
                    Скачать
                  </a>
                </Button>
              </Card>
            ))}
            {(!profile?.purchases || profile.purchases.length === 0) && (
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
                  <Badge>{frame.price === 0 ? 'Бесплатно' : `${frame.price} ₽`}</Badge>
                  <Button size="sm" onClick={() => purchaseFrame(frame.id, frame.price)}>
                    Купить
                  </Button>
                </div>
              </Card>
            ))}
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
                <Button size="sm" className="w-full" onClick={() => setActiveFrame(frame.id)}>
                  Установить
                </Button>
              </Card>
            ))}
            {userFrames.length === 0 && (
              <p className="col-span-2 text-center text-muted-foreground py-8">Нет рамок</p>
            )}
          </TabsContent>
        </Tabs>

        {selectedFriend && (
          <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Чат с {selectedFriend.display_name || selectedFriend.username}</DialogTitle>
              </DialogHeader>
              <div className="h-64 overflow-y-auto space-y-2 mb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-lg max-w-[70%] ${msg.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Сообщение..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
                <Button onClick={sendMessage}><Icon name="Send" size={18} /></Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}