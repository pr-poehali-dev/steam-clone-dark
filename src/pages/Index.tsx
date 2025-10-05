import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Profile from '@/components/Profile';

interface User {
  id: number;
  email: string;
  role: string;
  balance: number;
  is_banned: boolean;
}

interface Game {
  id: number;
  title: string;
  description: string;
  category: string;
  age_rating: string;
  file_url: string;
  publisher_login: string;
  status: string;
  price: number;
  is_popular: boolean;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [pendingGames, setPendingGames] = useState<Game[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allFrames, setAllFrames] = useState<any[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [frameForm, setFrameForm] = useState({ name: '', image_url: '', price: 0 });
  const { toast } = useToast();

  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    category: '',
    age_rating: '',
    file_url: '',
    price: 0,
    contact_email: ''
  });

  const categories = ['all', 'action', 'adventure', 'puzzle', 'strategy'];
  
  const filteredGames = games.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredUsers = allUsers.filter(u => 
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    fetchGames();
    fetchPopularGames();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingGames();
      fetchUsers();
      fetchAllGames();
      fetchAllFrames();
    }
  }, [user]);

  const fetchAllFrames = async () => {
    const res = await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_frames' })
    });
    const data = await res.json();
    setAllFrames(data);
  };

  const fetchGames = async () => {
    const response = await fetch('https://functions.poehali.dev/652e95bf-5fe0-44a4-9318-a30e4b811727?status=approved');
    const data = await response.json();
    setGames(data);
  };

  const fetchPopularGames = async () => {
    const response = await fetch('https://functions.poehali.dev/652e95bf-5fe0-44a4-9318-a30e4b811727?status=popular');
    const data = await response.json();
    setPopularGames(data);
  };

  const fetchPendingGames = async () => {
    const response = await fetch('https://functions.poehali.dev/652e95bf-5fe0-44a4-9318-a30e4b811727?status=pending');
    const data = await response.json();
    setPendingGames(data);
  };

  const fetchAllGames = async () => {
    const response = await fetch('https://functions.poehali.dev/652e95bf-5fe0-44a4-9318-a30e4b811727?status=all');
    const data = await response.json();
    setAllGames(data);
  };

  const fetchUsers = async () => {
    const response = await fetch('https://functions.poehali.dev/bbb9b4b5-e6d6-4b6d-9e10-cbfaf6120b5a?action=users');
    const data = await response.json();
    setAllUsers(data);
  };

  const handleAuth = async () => {
    const response = await fetch('https://functions.poehali.dev/4e8cbd36-9013-4dc8-b007-66416a15d75c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: authMode, ...authForm })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      if (data.is_banned) {
        toast({ title: 'Вы заблокированы', variant: 'destructive' });
        return;
      }
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      toast({ title: authMode === 'login' ? 'Вход выполнен' : 'Регистрация завершена' });
    } else {
      toast({ title: data.error || 'Ошибка', variant: 'destructive' });
    }
  };

  const handlePublishGame = async () => {
    await fetch('https://functions.poehali.dev/652e95bf-5fe0-44a4-9318-a30e4b811727', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...publishForm, publisher_login: user?.email })
    });
    
    setShowPublishDialog(false);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 5000);
    setPublishForm({ title: '', description: '', category: '', age_rating: '', file_url: '', price: 0, contact_email: '' });
  };

  const purchaseGame = async (gameId: number, price: number) => {
    const res = await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'purchase', user_id: user?.id, game_id: gameId })
    });
    const data = await res.json();
    
    if (data.success) {
      const updated = { ...user!, balance: data.new_balance };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      toast({ title: 'Игра куплена!' });
      fetchGames();
    } else {
      toast({ title: 'Недостаточно средств', variant: 'destructive' });
    }
  };

  const handleGameAction = async (gameId: number, status: string) => {
    await fetch('https://functions.poehali.dev/652e95bf-5fe0-44a4-9318-a30e4b811727', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gameId, status })
    });
    
    fetchPendingGames();
    fetchGames();
    fetchAllGames();
    toast({ title: status === 'approved' ? 'Игра одобрена' : 'Игра отклонена' });
  };

  const handleDeleteGame = async (gameId: number) => {
    await fetch(`https://functions.poehali.dev/652e95bf-5fe0-44a4-9318-a30e4b811727?id=${gameId}`, {
      method: 'DELETE'
    });
    
    fetchAllGames();
    fetchGames();
    fetchPendingGames();
    fetchPopularGames();
    toast({ title: 'Игра удалена' });
  };

  const handleUpdateGamePrice = async (gameId: number, price: number) => {
    await fetch('https://functions.poehali.dev/bbb9b4b5-e6d6-4b6d-9e10-cbfaf6120b5a', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_game_price', game_id: gameId, price })
    });
    
    fetchAllGames();
    fetchGames();
    toast({ title: 'Цена обновлена' });
  };

  const handleTogglePopular = async (gameId: number, isPopular: boolean) => {
    await fetch('https://functions.poehali.dev/bbb9b4b5-e6d6-4b6d-9e10-cbfaf6120b5a', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_popular', game_id: gameId, is_popular: isPopular })
    });
    
    fetchAllGames();
    fetchGames();
    fetchPopularGames();
    toast({ title: isPopular ? 'Добавлено в популярные' : 'Убрано из популярных' });
  };

  const handleUserAction = async (userId: number, action: string, value?: any) => {
    await fetch('https://functions.poehali.dev/bbb9b4b5-e6d6-4b6d-9e10-cbfaf6120b5a', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, ...value })
    });
    
    fetchUsers();
    if (action === 'ban' && userId === user?.id) {
      localStorage.removeItem('user');
      setUser(null);
      toast({ title: 'Вы заблокированы', variant: 'destructive' });
    }
  };

  const handleCreateFrame = async () => {
    await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_frame', ...frameForm })
    });
    fetchAllFrames();
    setFrameForm({ name: '', image_url: '', price: 0 });
    toast({ title: 'Рамка создана' });
  };

  const handleDeleteFrame = async (frameId: number) => {
    await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_frame', frame_id: frameId })
    });
    fetchAllFrames();
    toast({ title: 'Рамка удалена' });
  };

  const handleUpdateFramePrice = async (frameId: number, price: number) => {
    await fetch('https://functions.poehali.dev/170044e8-a677-4d2d-a212-1401ed1c7191', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_frame_price', frame_id: frameId, price })
    });
    fetchAllFrames();
    toast({ title: 'Цена обновлена' });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast({ title: 'Выход выполнен' });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card border-border">
          <div className="flex items-center gap-3 mb-8">
            <Icon name="Gamepad2" size={32} className="text-primary" />
            <h1 className="text-3xl font-bold">FTEAM</h1>
          </div>
          
          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Пароль</Label>
                <Input 
                  type="password" 
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <Button onClick={handleAuth} className="w-full bg-primary hover:bg-primary/90">
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </div>
          </Tabs>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="Gamepad2" size={28} className="text-primary" />
            <h1 className="text-2xl font-bold">FTEAM</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Icon name="Wallet" size={20} className="text-muted-foreground" />
              <span className="font-semibold">{user.balance.toFixed(2)} ₽</span>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={() => window.open('https://t.me/HE_CMOTRI_CYDA_EBANAT', '_blank')}
              >
                <Icon name="Plus" size={16} />
              </Button>
            </div>
            
            <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Icon name="Upload" size={18} />
                  Опубликовать игру
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Публикация игры в FTEAM</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название игры</Label>
                    <Input 
                      value={publishForm.title}
                      onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Тематика</Label>
                    <Select value={publishForm.category} onValueChange={(v) => setPublishForm({ ...publishForm, category: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Выберите тематику" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action">Экшен</SelectItem>
                        <SelectItem value="adventure">Приключения</SelectItem>
                        <SelectItem value="puzzle">Головоломка</SelectItem>
                        <SelectItem value="strategy">Стратегия</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Описание</Label>
                    <Textarea 
                      value={publishForm.description}
                      onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>Возрастное ограничение</Label>
                    <Select value={publishForm.age_rating} onValueChange={(v) => setPublishForm({ ...publishForm, age_rating: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Выберите возраст" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0+">0+</SelectItem>
                        <SelectItem value="6+">6+</SelectItem>
                        <SelectItem value="12+">12+</SelectItem>
                        <SelectItem value="16+">16+</SelectItem>
                        <SelectItem value="18+">18+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Ссылка на файл APK</Label>
                    <Input 
                      value={publishForm.file_url}
                      onChange={(e) => setPublishForm({ ...publishForm, file_url: e.target.value })}
                      className="mt-1"
                      placeholder="https://example.com/game.apk"
                    />
                  </div>
                  
                  <div>
                    <Label>Цена (₽)</Label>
                    <Input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={publishForm.price}
                      onChange={(e) => setPublishForm({ ...publishForm, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                      placeholder="0 - бесплатно"
                    />
                  </div>
                  
                  <Button onClick={handlePublishGame} className="w-full bg-primary">
                    Опубликовать игру
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {user.role === 'admin' && (
              <Button variant="default" asChild className="bg-primary">
                <a href="#admin">
                  <Icon name="Shield" size={18} className="mr-2" />
                  Админ панель
                </a>
              </Button>
            )}
            
            <Button variant="ghost" onClick={handleLogout}>
              <Icon name="LogOut" size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {popularGames.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Icon name="TrendingUp" size={32} className="text-yellow-500" />
              Популярные игры
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularGames.map((game) => (
                <Card key={game.id} className="overflow-hidden hover:border-yellow-500 transition-all hover:shadow-lg hover:shadow-yellow-500/20 group animate-fade-in border-yellow-500/30">
                  <div className="aspect-video bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <Icon name="Star" size={64} className="text-yellow-500/60 group-hover:text-yellow-500 transition-all group-hover:scale-110 relative z-10" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg line-clamp-1 flex-1">{game.title}</h3>
                      {game.price === 0 ? (
                        <Badge className="bg-green-600 hover:bg-green-700 ml-2">FREE</Badge>
                      ) : (
                        <Badge variant="default" className="ml-2">{game.price} ₽</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{game.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="capitalize">{game.category}</Badge>
                      <Badge variant="outline">{game.age_rating}</Badge>
                    </div>
                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700 group" asChild>
                      <a href={game.file_url} target="_blank">
                        <Icon name="Download" size={18} className="mr-2 group-hover:animate-bounce" />
                        {game.price === 0 ? 'Скачать' : `Купить за ${game.price} ₽`}
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Каталог игр для Android</h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Поиск игр..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className="whitespace-nowrap"
                  >
                    {cat === 'all' ? 'Все' : 
                     cat === 'action' ? 'Экшен' :
                     cat === 'adventure' ? 'Приключения' :
                     cat === 'puzzle' ? 'Головоломки' : 'Стратегии'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="GamepadIcon" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">Игры не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.map((game) => (
                <Card key={game.id} className="overflow-hidden hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20 group animate-fade-in">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <Icon name="Gamepad2" size={64} className="text-primary/60 group-hover:text-primary transition-all group-hover:scale-110 relative z-10" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg line-clamp-1 flex-1">{game.title}</h3>
                      {game.price === 0 ? (
                        <Badge className="bg-green-600 hover:bg-green-700 ml-2">FREE</Badge>
                      ) : (
                        <Badge variant="default" className="ml-2">{game.price} ₽</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{game.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="capitalize">{game.category}</Badge>
                      <Badge variant="outline">{game.age_rating}</Badge>
                      {game.is_popular && <Badge className="bg-yellow-600">Популярная</Badge>}
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 group" asChild>
                      <a href={game.file_url} target="_blank">
                        <Icon name="Download" size={18} className="mr-2 group-hover:animate-bounce" />
                        {game.price === 0 ? 'Скачать' : `Купить за ${game.price} ₽`}
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {user.role === 'admin' && (
          <section id="admin" className="scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Админ панель</h2>
            
            <Tabs defaultValue="moderation" className="space-y-6">
              <TabsList>
                <TabsTrigger value="moderation">Модерация игр</TabsTrigger>
                <TabsTrigger value="all-games">Все игры</TabsTrigger>
                <TabsTrigger value="users">Пользователи</TabsTrigger>
                <TabsTrigger value="frames">Рамки</TabsTrigger>
              </TabsList>
              
              <TabsContent value="moderation" className="space-y-4">
                {pendingGames.map((game) => (
                  <Card key={game.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                        <p className="text-muted-foreground mb-3">{game.description}</p>
                        <div className="flex gap-2 mb-3">
                          <Badge>{game.category}</Badge>
                          <Badge variant="outline">{game.age_rating}</Badge>
                          <Badge variant="secondary">От: {game.publisher_login}</Badge>
                        </div>
                        <a href={game.file_url} target="_blank" className="text-primary hover:underline text-sm flex items-center gap-1">
                          <Icon name="Download" size={16} />
                          Скачать файл
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleGameAction(game.id, 'approved')} variant="default" className="bg-green-600 hover:bg-green-700">
                          <Icon name="Check" size={18} />
                        </Button>
                        <Button onClick={() => handleGameAction(game.id, 'rejected')} variant="destructive">
                          <Icon name="X" size={18} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {pendingGames.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Нет заявок на модерацию</p>
                )}
              </TabsContent>
              
              <TabsContent value="all-games" className="space-y-4">
                {allGames.map((game) => (
                  <Card key={game.id} className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                        <p className="text-muted-foreground mb-3">{game.description}</p>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge>{game.category}</Badge>
                          <Badge variant="outline">{game.age_rating}</Badge>
                          <Badge variant={
                            game.status === 'approved' ? 'default' :
                            game.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {game.status === 'approved' ? 'Одобрена' :
                             game.status === 'pending' ? 'На модерации' : 'Отклонена'}
                          </Badge>
                          <Badge variant="secondary">От: {game.publisher_login}</Badge>
                          {game.is_popular && <Badge className="bg-yellow-600">Популярная</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Icon name="DollarSign" size={16} className="text-muted-foreground" />
                            <Input 
                              type="number" 
                              min="0"
                              step="0.01"
                              defaultValue={game.price}
                              onBlur={(e) => handleUpdateGamePrice(game.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </div>
                          <Button
                            onClick={() => handleTogglePopular(game.id, !game.is_popular)}
                            variant={game.is_popular ? 'default' : 'outline'}
                            size="sm"
                          >
                            <Icon name="Star" size={16} className="mr-1" />
                            {game.is_popular ? 'Популярная' : 'В популярные'}
                          </Button>
                        </div>
                        <a href={game.file_url} target="_blank" className="text-primary hover:underline text-sm flex items-center gap-1">
                          <Icon name="Download" size={16} />
                          Скачать файл
                        </a>
                      </div>
                      <Button 
                        onClick={() => handleDeleteGame(game.id)} 
                        variant="destructive"
                        size="sm"
                      >
                        <Icon name="Trash2" size={18} className="mr-2" />
                        Удалить
                      </Button>
                    </div>
                  </Card>
                ))}
                {allGames.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Нет игр в системе</p>
                )}
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                <div className="mb-6">
                  <Input
                    placeholder="Поиск по имени пользователя..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                {filteredUsers.map((u) => (
                  <Card key={u.id} className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{u.email}</h3>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                          {u.is_banned && <Badge variant="destructive">Заблокирован</Badge>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Icon name="Wallet" size={16} className="text-muted-foreground" />
                            <Input 
                              type="number" 
                              defaultValue={u.balance}
                              onBlur={(e) => handleUserAction(u.id, 'update_balance', { balance: parseFloat(e.target.value) })}
                              className="w-32"
                            />
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleUserAction(u.id, u.is_banned ? 'unban' : 'ban')}
                        variant={u.is_banned ? 'outline' : 'destructive'}
                      >
                        {u.is_banned ? 'Разбанить' : 'Забанить'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="frames" className="space-y-4">
                <Card className="p-6 bg-card/50">
                  <h3 className="text-lg font-semibold mb-4">Создать новую рамку</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Input
                      placeholder="Название"
                      value={frameForm.name}
                      onChange={(e) => setFrameForm({ ...frameForm, name: e.target.value })}
                    />
                    <Input
                      placeholder="URL изображения"
                      value={frameForm.image_url}
                      onChange={(e) => setFrameForm({ ...frameForm, image_url: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Цена"
                      value={frameForm.price}
                      onChange={(e) => setFrameForm({ ...frameForm, price: parseFloat(e.target.value) || 0 })}
                    />
                    <Button onClick={handleCreateFrame}>
                      <Icon name="Plus" size={18} className="mr-2" />
                      Добавить
                    </Button>
                  </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allFrames.map((frame) => (
                    <Card key={frame.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-16 h-16 rounded border-2 bg-center bg-cover"
                          style={{ borderColor: frame.image_url || '#ccc', backgroundImage: frame.image_url ? `url(${frame.image_url})` : 'none' }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{frame.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Icon name="DollarSign" size={14} className="text-muted-foreground" />
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={frame.price}
                              onBlur={(e) => handleUpdateFramePrice(frame.id, parseFloat(e.target.value) || 0)}
                              className="w-20 h-7 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteFrame(frame.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                {allFrames.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Рамок пока нет</p>
                )}
              </TabsContent>
            </Tabs>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;