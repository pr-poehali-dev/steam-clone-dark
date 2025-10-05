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
  onLogout: () => void;
}

export default function Profile({ user, onUpdate, onClose, onLogout }: ProfileProps) {
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
  const [marketListings, setMarketListings] = useState<any[]>([]);
  const [sellPrice, setSellPrice] = useState<{[key: string]: number}>({});
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
    fetchMarketListings();
    searchUsers('');
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

  const fetchMarketListings = async () => {
    const res = await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191?action=market_listings');
    const data = await res.json();
    setMarketListings(data.listings || []);
  };

  const listOnMarket = async (itemType: string, itemId: number, price: number) => {
    await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list_on_market', user_id: user.id, item_type: itemType, item_id: itemId, price })
    });
    fetchProfile();
    fetchMarketListings();
    toast({ title: 'Выставлено на продажу' });
  };

  const removeFromMarket = async (itemType: string, itemId: number) => {
    await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_from_market', user_id: user.id, item_type: itemType, item_id: itemId })
    });
    fetchProfile();
    fetchMarketListings();
    toast({ title: 'Снято с продажи' });
  };

  const buyFromMarket = async (listing: any) => {
    const res = await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buy_from_market', buyer_id: user.id, listing_id: listing.id, item_type: listing.item_type })
    });
    const data = await res.json();
    
    if (data.success) {
      fetchProfile();
      fetchMarketListings();
      toast({ title: 'Покупка завершена!' });
    } else {
      toast({ title: data.error, variant: 'destructive' });
    }
  };

  const fetchProfile = async () => {
    const res = await fetch(`https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191?user_id=${user.id}`);
    const data = await res.json();
    setProfile(data);
    setEditForm({
      username: data.username || '',
      display_name: data.display_name || '',
      avatar_url: data.avatar_url || ''
    });
  };

  const fetchFriends = async () => {
    const res = await fetch(`https://functions.poehali.dev/1727bd49-5413-4e32-91b6-cee6fcffa3de?action=friends&user_id=${user.id}`);
    const data = await res.json();
    setFriends(data);
  };

  const searchUsers = async (query: string) => {
    const res = await fetch(`https://functions.poehali.dev/1727bd49-5413-4e32-91b6-cee6fcffa3de?action=search&user_id=${user.id}&search=${query || ''}`);
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
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 gap-1 overflow-x-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm whitespace-nowrap">Профиль</TabsTrigger>
            <TabsTrigger value="friends" className="text-xs sm:text-sm whitespace-nowrap">Друзья</TabsTrigger>
            <TabsTrigger value="library" className="text-xs sm:text-sm whitespace-nowrap">Библиотека</TabsTrigger>
            <TabsTrigger value="market" className="text-xs sm:text-sm whitespace-nowrap">Маркет</TabsTrigger>
            <TabsTrigger value="frames-shop" className="text-xs sm:text-sm whitespace-nowrap">Рамки</TabsTrigger>
            <TabsTrigger value="my-frames" className="text-xs sm:text-sm whitespace-nowrap">Мои рамки</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm whitespace-nowrap">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {editForm.avatar_url ? (
                    <img src={editForm.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="User" size={40} className="text-primary" />
                  )}
                </div>
                {profile?.active_frame_id && userFrames.find(f => f.id === profile.active_frame_id) && (
                  <img 
                    src={userFrames.find(f => f.id === profile.active_frame_id)?.image_url} 
                    alt="Frame" 
                    className="absolute inset-0 w-20 h-20 object-cover z-10 pointer-events-none"
                  />
                )}
              </div>
              <div className="flex-1">
                {!editMode ? (
                  <>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {profile?.display_name || profile?.username}
                      {profile?.has_checkmark && <Icon name="BadgeCheck" size={20} className="text-green-500" />}
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
                      <div className="relative w-10 h-10">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                          {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <Icon name="User" size={20} />}
                        </div>
                        {friend.frame_url && (
                          <img src={friend.frame_url} alt="Frame" className="absolute inset-0 w-10 h-10 object-cover z-10 pointer-events-none" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-1">
                          {friend.display_name || friend.username}
                          {friend.has_checkmark && <Icon name="BadgeCheck" size={16} className="text-green-500" />}
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
                      <div className="relative w-10 h-10">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <Icon name="User" size={20} />}
                        </div>
                        {user.frame_url && (
                          <img src={user.frame_url} alt="Frame" className="absolute inset-0 w-10 h-10 object-cover z-10 pointer-events-none" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-1">
                          {user.display_name || user.username}
                          {user.has_checkmark && <Icon name="BadgeCheck" size={16} className="text-green-500" />}
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
                <div className="flex flex-col sm:flex-row gap-4">
                  {game.logo_url && (
                    <img src={game.logo_url} alt={game.title} className="w-full sm:w-20 h-40 sm:h-20 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold">{game.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button asChild size="sm" className="bg-green-600">
                        <a href={game.file_url} target="_blank">
                          <Icon name="Download" size={16} className="mr-2" />
                          Скачать
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={async () => {
                          const res = await fetch('https://functions.poehali.dev/bbb9b4b5-e6d6-4b6d-9e10-cbfaf6120b5a', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: user.id, game_id: game.id })
                          });
                          const data = await res.json();
                          if (data.success) {
                            const updated = { ...user, balance: data.new_balance };
                            localStorage.setItem('user', JSON.stringify(updated));
                            onUpdate(updated);
                            fetchProfile();
                            toast({ title: `Возвращено ${data.refund} монет (90% от ${game.price})` });
                          } else {
                            toast({ title: data.error, variant: 'destructive' });
                          }
                        }}
                      >
                        <Icon name="Trash2" size={16} className="mr-2" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {(!profile?.purchases || profile.purchases.length === 0) && (
              <p className="text-center text-muted-foreground py-8">Нет купленных игр</p>
            )}
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <p className="text-sm text-muted-foreground">Торговая площадка - купля/продажа игр и рамок между пользователями</p>
            
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Купить</TabsTrigger>
                <TabsTrigger value="sell">Продать</TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-4 mt-4">
                {marketListings.length === 0 ? (
                  <Card className="p-4 bg-muted/50">
                    <p className="text-center text-muted-foreground">Нет товаров на продажу</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {marketListings.map((listing) => (
                      <Card key={`${listing.item_type}-${listing.id}`} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {listing.item_image && (
                              <img src={listing.item_image} alt={listing.item_name} className="w-16 h-16 object-cover rounded" />
                            )}
                            <div>
                              <h4 className="font-semibold">{listing.item_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {listing.item_type === 'game' ? 'Игра' : 'Рамка'} от {listing.seller_email}
                              </p>
                              <p className="text-lg font-bold text-primary mt-1">{listing.market_price} ₽</p>
                            </div>
                          </div>
                          {listing.user_id !== user.id && (
                            <Button onClick={() => buyFromMarket(listing)}>
                              <Icon name="ShoppingCart" size={18} className="mr-2" />
                              Купить
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Мои игры</h4>
                    {profile?.purchases && profile.purchases.length > 0 ? (
                      <div className="grid gap-3">
                        {profile.purchases.map((game: any) => (
                          <Card key={game.purchase_id} className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {game.logo_url && (
                                  <img src={game.logo_url} alt={game.title} className="w-12 h-12 object-cover rounded" />
                                )}
                                <div>
                                  <h5 className="font-medium">{game.title}</h5>
                                  <p className="text-sm text-muted-foreground">Куплена за {game.price} ₽</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number"
                                  placeholder="Цена"
                                  className="w-24"
                                  value={sellPrice[`game-${game.purchase_id}`] || ''}
                                  onChange={(e) => setSellPrice({...sellPrice, [`game-${game.purchase_id}`]: parseInt(e.target.value) || 0})}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => listOnMarket('game', game.purchase_id, sellPrice[`game-${game.purchase_id}`] || 0)}
                                  disabled={!sellPrice[`game-${game.purchase_id}`]}
                                >
                                  Продать
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-4 bg-muted/50">
                        <p className="text-center text-muted-foreground">Нет игр для продажи</p>
                      </Card>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Мои рамки</h4>
                    {profile?.frames && profile.frames.length > 0 ? (
                      <div className="grid gap-3">
                        {profile.frames.map((frame: any) => (
                          <Card key={frame.user_frame_id} className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {frame.image_url && (
                                  <img src={frame.image_url} alt={frame.name} className="w-12 h-12 object-cover rounded" />
                                )}
                                <div>
                                  <h5 className="font-medium">{frame.name}</h5>
                                  <p className="text-sm text-muted-foreground">Куплена за {frame.price} ₽</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number"
                                  placeholder="Цена"
                                  className="w-24"
                                  value={sellPrice[`frame-${frame.user_frame_id}`] || ''}
                                  onChange={(e) => setSellPrice({...sellPrice, [`frame-${frame.user_frame_id}`]: parseInt(e.target.value) || 0})}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => listOnMarket('frame', frame.user_frame_id, sellPrice[`frame-${frame.user_frame_id}`] || 0)}
                                  disabled={!sellPrice[`frame-${frame.user_frame_id}`]}
                                >
                                  Продать
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-4 bg-muted/50">
                        <p className="text-center text-muted-foreground">Нет рамок для продажи</p>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
                {profile?.is_verified && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <Icon name="Shield" size={20} />
                    <span className="font-medium">Верифицированный аккаунт</span>
                  </div>
                )}
                {profile?.has_checkmark && (
                  <div className="flex items-center gap-2 text-green-500">
                    <Icon name="BadgeCheck" size={20} />
                    <span className="font-medium">Проверенный профиль</span>
                  </div>
                )}
                <Button variant="destructive" onClick={onLogout} className="w-full">
                  <Icon name="LogOut" size={18} className="mr-2" />
                  Выйти из аккаунта
                </Button>
              </div>
            </Card>
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