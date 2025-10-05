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
  username?: string;
  display_name?: string;
  avatar_url?: string;
  active_frame_id?: number;
}

interface Game {
  id: number;
  title: string;
  description: string;
  category: string;
  age_rating: string;
  file_url: string;
  logo_url?: string;
  publisher_login: string;
  status: string;
  price: number;
  is_popular: boolean;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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
    logo_url: '',
    price: 0
  });

  const categories = ['all', 'action', 'adventure', 'puzzle', 'strategy'];

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
    loadGames();
  }, []);

  const loadGames = () => {
    const allGames = JSON.parse(localStorage.getItem('games') || '[]');
    setGames(allGames.filter((g: Game) => g.status === 'approved'));
  };

  const filteredGames = games.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularGames = games.filter(g => g.is_popular);

  const handleAuth = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (authMode === 'register') {
      const exists = users.find((u: User) => u.email === authForm.email);
      if (exists) {
        toast({ title: 'Пользователь уже существует', variant: 'destructive' });
        return;
      }
      
      const isFirstUser = users.length === 0;
      
      const newUser: User = {
        id: Date.now(),
        email: authForm.email,
        role: isFirstUser ? 'admin' : 'user',
        balance: 1000,
        username: authForm.email.split('@')[0],
        display_name: authForm.email.split('@')[0]
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      toast({ title: isFirstUser ? 'Вы администратор! Регистрация завершена' : 'Регистрация завершена' });
    } else {
      const found = users.find((u: User) => u.email === authForm.email);
      if (!found) {
        toast({ title: 'Пользователь не найден', variant: 'destructive' });
        return;
      }
      
      localStorage.setItem('user', JSON.stringify(found));
      setUser(found);
      toast({ title: 'Вход выполнен' });
    }
  };

  const handlePublishGame = () => {
    if (!publishForm.title || !publishForm.description || !publishForm.category || !publishForm.age_rating || !publishForm.file_url || !publishForm.logo_url) {
      toast({ title: 'Заполните все обязательные поля', variant: 'destructive' });
      return;
    }
    
    const allGames = JSON.parse(localStorage.getItem('games') || '[]');
    const newGame: Game = {
      id: Date.now(),
      ...publishForm,
      publisher_login: user?.email || '',
      status: user?.role === 'admin' ? 'approved' : 'pending',
      is_popular: false
    };
    
    allGames.push(newGame);
    localStorage.setItem('games', JSON.stringify(allGames));
    
    setShowPublishDialog(false);
    toast({ title: user?.role === 'admin' ? 'Игра опубликована!' : 'Игра отправлена на модерацию' });
    setPublishForm({ title: '', description: '', category: '', age_rating: '', file_url: '', logo_url: '', price: 0 });
    
    if (user?.role === 'admin') {
      loadGames();
    }
  };

  const purchaseGame = (game: Game) => {
    if (!user) return;
    
    if (user.balance < game.price) {
      toast({ title: 'Недостаточно средств', variant: 'destructive' });
      return;
    }

    const purchasedGames = JSON.parse(localStorage.getItem('purchasedGames') || '{}');
    if (!purchasedGames[user.id]) purchasedGames[user.id] = [];
    
    const alreadyPurchased = purchasedGames[user.id].some((g: any) => g.id === game.id);
    if (alreadyPurchased) {
      toast({ title: 'Игра уже куплена', variant: 'destructive' });
      return;
    }

    purchasedGames[user.id].push(game);
    localStorage.setItem('purchasedGames', JSON.stringify(purchasedGames));
    
    const updated = { ...user, balance: user.balance - game.price };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    
    toast({ title: 'Игра куплена!' });
  };

  const handleGameAction = (gameId: number, status: string) => {
    const allGames = JSON.parse(localStorage.getItem('games') || '[]');
    const updated = allGames.map((g: Game) => g.id === gameId ? { ...g, status } : g);
    localStorage.setItem('games', JSON.stringify(updated));
    loadGames();
    toast({ title: status === 'approved' ? 'Игра одобрена' : 'Игра отклонена' });
  };

  const handleDeleteGame = (gameId: number) => {
    const allGames = JSON.parse(localStorage.getItem('games') || '[]');
    const updated = allGames.filter((g: Game) => g.id !== gameId);
    localStorage.setItem('games', JSON.stringify(updated));
    loadGames();
    toast({ title: 'Игра удалена' });
  };

  const handleUpdateGamePrice = (gameId: number, price: number) => {
    const allGames = JSON.parse(localStorage.getItem('games') || '[]');
    const updated = allGames.map((g: Game) => g.id === gameId ? { ...g, price } : g);
    localStorage.setItem('games', JSON.stringify(updated));
    loadGames();
    toast({ title: 'Цена обновлена' });
  };

  const handleTogglePopular = (gameId: number, isPopular: boolean) => {
    const allGames = JSON.parse(localStorage.getItem('games') || '[]');
    const updated = allGames.map((g: Game) => g.id === gameId ? { ...g, is_popular: isPopular } : g);
    localStorage.setItem('games', JSON.stringify(updated));
    loadGames();
    toast({ title: isPopular ? 'Добавлено в популярные' : 'Убрано из популярных' });
  };

  const handleUserAction = (userId: number, action: string, value?: any) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let updated = users;

    if (action === 'update_balance') {
      updated = users.map((u: User) => u.id === userId ? { ...u, balance: value.balance } : u);
    }

    localStorage.setItem('users', JSON.stringify(updated));
    
    if (userId === user?.id && action === 'update_balance') {
      const updatedUser = { ...user, balance: value.balance };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const handleCreateFrame = () => {
    if (!frameForm.name || !frameForm.image_url) {
      toast({ title: 'Заполните название и URL изображения', variant: 'destructive' });
      return;
    }

    const frames = JSON.parse(localStorage.getItem('frames') || '[]');
    const newFrame = {
      id: Date.now(),
      ...frameForm
    };
    frames.push(newFrame);
    localStorage.setItem('frames', JSON.stringify(frames));
    setFrameForm({ name: '', image_url: '', price: 0 });
    toast({ title: 'Рамка создана' });
  };

  const handleDeleteFrame = (frameId: number) => {
    const frames = JSON.parse(localStorage.getItem('frames') || '[]');
    const updated = frames.filter((f: any) => f.id !== frameId);
    localStorage.setItem('frames', JSON.stringify(updated));
    toast({ title: 'Рамка удалена' });
  };

  const handleUpdateFramePrice = (frameId: number, price: number) => {
    const frames = JSON.parse(localStorage.getItem('frames') || '[]');
    const updated = frames.map((f: any) => f.id === frameId ? { ...f, price } : f);
    localStorage.setItem('frames', JSON.stringify(updated));
    toast({ title: 'Цена обновлена' });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast({ title: 'Выход выполнен' });
  };

  const purchasedGames = user ? (JSON.parse(localStorage.getItem('purchasedGames') || '{}')[user.id] || []) : [];
  const allGames = JSON.parse(localStorage.getItem('games') || '[]');
  const pendingGames = allGames.filter((g: Game) => g.status === 'pending');
  const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
  const allFrames = JSON.parse(localStorage.getItem('frames') || '[]');
  const filteredUsers = allUsers.filter((u: User) => u.email.toLowerCase().includes(userSearchQuery.toLowerCase()));

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
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="Gamepad2" size={28} className="text-primary" />
            <h1 className="text-2xl font-bold">FTEAM</h1>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Icon name="Wallet" size={20} className="text-muted-foreground" />
              <span className="font-semibold">{user.balance.toFixed(2)} ₽</span>
            </div>
            
            <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Icon name="Upload" size={18} />
                  <span className="hidden sm:inline">Опубликовать игру</span>
                  <span className="sm:hidden">Опубликовать</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Публикация игры в FTEAM</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название игры <span className="text-red-500">*</span></Label>
                    <Input 
                      value={publishForm.title}
                      onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Тематика <span className="text-red-500">*</span></Label>
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
                    <Label>Описание <span className="text-red-500">*</span></Label>
                    <Textarea 
                      value={publishForm.description}
                      onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>Возрастное ограничение <span className="text-red-500">*</span></Label>
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
                    <Label>Ссылка на файл APK <span className="text-red-500">*</span></Label>
                    <Input 
                      value={publishForm.file_url}
                      onChange={(e) => setPublishForm({ ...publishForm, file_url: e.target.value })}
                      className="mt-1"
                      placeholder="https://example.com/game.apk"
                    />
                  </div>
                  
                  <div>
                    <Label>Ссылка на логотип <span className="text-red-500">*</span></Label>
                    <Input 
                      value={publishForm.logo_url}
                      onChange={(e) => setPublishForm({ ...publishForm, logo_url: e.target.value })}
                      className="mt-1"
                      placeholder="https://example.com/logo.png"
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
                  <span className="hidden sm:inline">Админ панель</span>
                  <span className="sm:hidden">Админ</span>
                </a>
              </Button>
            )}
            
            <Button variant="ghost" onClick={() => setShowProfile(true)}>
              <Icon name="User" size={18} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {popularGames.map((game) => (
                <Card key={game.id} className="overflow-hidden hover:border-yellow-500 transition-all hover:shadow-lg hover:shadow-yellow-500/20 group animate-fade-in border-yellow-500/30">
                  <div className="aspect-video bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center relative overflow-hidden">
                    {game.logo_url ? (
                      <img src={game.logo_url} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <Icon name="Star" size={64} className="text-yellow-500/60 group-hover:text-yellow-500 transition-all group-hover:scale-110 relative z-10" />
                      </>
                    )}
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
                    {purchasedGames.some((g: any) => g.id === game.id) ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                        <a href={game.file_url} target="_blank">
                          <Icon name="Download" size={18} className="mr-2" />
                          Скачать
                        </a>
                      </Button>
                    ) : game.price === 0 ? (
                      <Button className="w-full bg-yellow-600 hover:bg-yellow-700 group" asChild>
                        <a href={game.file_url} target="_blank">
                          <Icon name="Download" size={18} className="mr-2 group-hover:animate-bounce" />
                          Скачать
                        </a>
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => purchaseGame(game)}
                      >
                        <Icon name="ShoppingCart" size={18} className="mr-2" />
                        Купить за {game.price} ₽
                      </Button>
                    )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredGames.map((game) => (
                <Card key={game.id} className="overflow-hidden hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20 group animate-fade-in">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                    {game.logo_url ? (
                      <img src={game.logo_url} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <Icon name="Gamepad2" size={64} className="text-primary/60 group-hover:text-primary transition-all group-hover:scale-110 relative z-10" />
                      </>
                    )}
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
                    {purchasedGames.some((g: any) => g.id === game.id) ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                        <a href={game.file_url} target="_blank">
                          <Icon name="Download" size={18} className="mr-2" />
                          Скачать
                        </a>
                      </Button>
                    ) : game.price === 0 ? (
                      <Button className="w-full bg-primary hover:bg-primary/90 group" asChild>
                        <a href={game.file_url} target="_blank">
                          <Icon name="Download" size={18} className="mr-2 group-hover:animate-bounce" />
                          Скачать
                        </a>
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => purchaseGame(game)}
                      >
                        <Icon name="ShoppingCart" size={18} className="mr-2" />
                        Купить за {game.price} ₽
                      </Button>
                    )}
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
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
                <TabsTrigger value="moderation" className="text-xs sm:text-sm">Модерация</TabsTrigger>
                <TabsTrigger value="all-games" className="text-xs sm:text-sm">Все игры</TabsTrigger>
                <TabsTrigger value="users" className="text-xs sm:text-sm">Пользователи</TabsTrigger>
                <TabsTrigger value="frames" className="text-xs sm:text-sm">Рамки</TabsTrigger>
              </TabsList>
              
              <TabsContent value="moderation" className="space-y-4">
                {pendingGames.map((game: Game) => (
                  <Card key={game.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 w-full">
                        <h3 className="text-lg sm:text-xl font-bold mb-2">{game.title}</h3>
                        <p className="text-muted-foreground mb-3 text-sm sm:text-base">{game.description}</p>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge className="text-xs">{game.category}</Badge>
                          <Badge variant="outline" className="text-xs">{game.age_rating}</Badge>
                          <Badge variant="secondary" className="text-xs">От: {game.publisher_login}</Badge>
                        </div>
                        <a href={game.file_url} target="_blank" className="text-primary hover:underline text-sm flex items-center gap-1">
                          <Icon name="Download" size={16} />
                          Скачать файл
                        </a>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={() => handleGameAction(game.id, 'approved')} variant="default" className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                          <Icon name="Check" size={18} />
                        </Button>
                        <Button onClick={() => handleGameAction(game.id, 'rejected')} variant="destructive" className="flex-1 sm:flex-none">
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
                {allGames.map((game: Game) => (
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
                    placeholder="Поиск по email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                {filteredUsers.map((u: User) => (
                  <Card key={u.id} className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{u.email}</h3>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
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
                  {allFrames.map((frame: any) => (
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

      {showProfile && user && (
        <Profile 
          user={user} 
          onUpdate={setUser} 
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default Index;