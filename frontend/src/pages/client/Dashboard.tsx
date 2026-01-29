import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { 
  ShoppingCart, Package, Clock, MapPin, Plus, Minus, 
  Trash2, ChevronLeft, ChevronRight, Store, Info, Tag, 
  Search, Home, User, X, Star, Settings, LogOut, Truck, Heart
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const DELIVERY_FEE = 200;

interface StoreInfo { id: string; fullName: string; rating?: number; isClosed?: boolean; }
interface Product {
  id: string; name: string; description?: string;
  price: string; oldPrice?: string; storeId: string;
  imageUrl?: string; category?: { id: string, name: string };
}
interface Order { id: string; status: string; totalAmount: string; createdAt: string; }

const ClientDashboard = () => {
  // Расширяем view для экрана избранного
  const [view, setView] = useState<'stores' | 'catalog' | 'cart' | 'orders' | 'favorites'>('stores');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null);

  // Стейты данных
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Стейты поиска и фильтрации
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);
  
  const { items, addItem, updateQty, removeItem, clearCart } = useCartStore();
  const { storeIds, productIds, toggleStore, toggleProduct } = useFavoritesStore();
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    fetchStores();
    fetchOrders();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await api.get('/users/stores');
      const currentHour = new Date().getHours();
      const realTimeStores = res.data.map((s: any) => ({
          ...s,
          rating: (Math.random() * (5 - 4) + 4).toFixed(1),
          isClosed: currentHour >= 22 || currentHour < 8
      }));
      setStores(realTimeStores);
    } catch (err) { console.error("Ошибка загрузки"); }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my/client');
      setOrders(res.data);
    } catch (err) { console.error("Ошибка загрузки заказов"); }
  };

  const filteredStores = stores
    .filter(store => store.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(store => !showOnlyOpen || !store.isClosed)
    .sort((a, b) => sortByRating ? Number(b.rating) - Number(a.rating) : 0);

  const openStore = async (store: StoreInfo) => {
    if (store.isClosed) return alert("Магазин сейчас закрыт");
    setSelectedStore(store);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products`), 
        api.get('/products/categories')
      ]);
      setProducts(prodRes.data.filter((p: any) => p.storeId === store.id));
      setCategories(catRes.data);
      setView('catalog');
    } catch (err) { console.error("Ошибка загрузки витрины"); }
  };

  const createOrder = async () => {
    if (items.length === 0) return;
    if (!address) return alert("Введите адрес доставки!");
    try {
      const res = await api.post('/orders', {
        storeId: items[0].storeId,
        address, comment,
        items: items.map(i => ({ productId: i.id, quantity: i.qty }))
      });
      clearCart(); setAddress(''); setComment('');
      if (res.data.confirmation_url) {
        const url = new URL(res.data.confirmation_url);
        navigate(url.pathname + url.search);
      } else {
        setView('orders');
      }
      fetchOrders();
    } catch (err) { alert("Ошибка при создании заказа"); }
  };

  const productsTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = productsTotal + (items.length > 0 ? DELIVERY_FEE : 0);

  const ProductCounter = ({ product }: { product: Product }) => {
    const cartItem = items.find(i => i.id === product.id);
    if (!cartItem) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); addItem(product); }}
          className="bg-blue-600 text-white w-full py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 active:scale-95 transition"
        >
          Добавить
        </button>
      );
    }
    return (
      <div className="flex items-center justify-between bg-blue-50 rounded-xl p-1 border border-blue-100">
        <button 
          onClick={(e) => { e.stopPropagation(); cartItem.qty === 1 ? removeItem(product.id) : updateQty(product.id, -1); }}
          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-blue-600 shadow-sm"
        >
          {cartItem.qty === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} />}
        </button>
        <span className="text-xs font-black text-blue-600 px-2">{cartItem.qty}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); updateQty(product.id, 1); }}
          className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-24 relative overflow-hidden font-sans">
      
      {/* --- PROFILE DRAWER --- */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isProfileOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isProfileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsProfileOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-4/5 bg-white shadow-2xl transition-transform duration-500 p-8 ${isProfileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black tracking-tighter italic">ПРОФИЛЬ</h2>
            <button onClick={() => setIsProfileOpen(false)} className="p-2 bg-gray-50 rounded-full"><X size={20}/></button>
          </div>
          <div className="space-y-4">
            <button onClick={() => { setView('orders'); setIsProfileOpen(false); }} className="w-full flex items-center gap-4 p-5 bg-blue-50 text-blue-700 rounded-[24px] font-black text-sm">
              <Clock size={20} /> Мои заказы
            </button>
            <button onClick={() => { setView('favorites'); setIsProfileOpen(false); }} className="w-full flex items-center gap-4 p-5 bg-red-50 text-red-600 rounded-[24px] font-black text-sm">
              <Heart size={20} className="fill-current" /> Избранное
            </button>
            <div className="w-full flex items-center gap-4 p-5 bg-gray-50 text-gray-400 rounded-[24px] font-bold text-sm opacity-60">
              <Star size={20} /> Мои отзывы <span className="text-[8px] bg-gray-200 px-2 py-1 rounded-full ml-auto">СКОРО</span>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-4 p-5 bg-slate-900 text-white rounded-[24px] font-black text-sm mt-10">
              <LogOut size={20} /> Выйти
            </button>
          </div>
        </div>
      </div>

      {/* --- VIEW: STORES --- */}
      {view === 'stores' && (
        <div className="p-6 animate-in fade-in">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">FreshGO</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-8">Локальная доставка</p>
          
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-4 text-gray-300" size={20}/>
              <input type="text" placeholder="Поиск магазина..." className="w-full bg-gray-50 p-4 pl-12 rounded-[24px] text-sm border-none shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setShowOnlyOpen(!showOnlyOpen)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${showOnlyOpen ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400 border-gray-100'}`}>Открыто</button>
              <button onClick={() => setSortByRating(!sortByRating)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${sortByRating ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-400 border-gray-100'}`}>По рейтингу</button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredStores.map(store => (
              <div key={store.id} className="relative">
                <div onClick={() => openStore(store)} className={`bg-gray-50 p-6 rounded-[40px] border border-gray-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer ${store.isClosed ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Store size={28}/></div>
                    <div>
                      <div className="font-black text-lg text-gray-800 leading-tight">{store.fullName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase ${store.isClosed ? 'text-red-500' : 'text-green-500'}`}>{store.isClosed ? 'Закрыто' : 'Открыто'}</span>
                        <span className="text-orange-500 text-[9px] font-black flex items-center gap-0.5"><Star size={10} fill="currentColor"/> {store.rating}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleStore(store.id); }} className="absolute top-6 right-14 p-2">
                  <Heart size={20} className={storeIds.includes(store.id) ? "fill-red-500 text-red-500" : "text-gray-300"} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- VIEW: CATALOG --- */}
      {view === 'catalog' && selectedStore && (
        <div className="animate-in slide-in-from-right">
          <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('stores')} className="p-2 bg-gray-50 rounded-full"><ChevronLeft size={20}/></button>
              <h2 className="text-lg font-black truncate max-w-[180px]">{selectedStore.fullName}</h2>
            </div>
            <button onClick={() => navigate(`/store/${selectedStore.id}/info`)} className="p-2 bg-blue-50 text-blue-600 rounded-full"><Info size={20}/></button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden flex flex-col p-2 shadow-sm">
                <div className="h-32 bg-gray-50 rounded-[24px] mb-3 overflow-hidden relative" onClick={() => navigate(`/product/${product.id}`)}>
                  {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={32}/></div>}
                  {product.oldPrice && <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full">SALE</div>}
                  <button onClick={(e) => { e.stopPropagation(); toggleProduct(product.id); }} className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm">
                    <Heart size={14} className={productIds.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                  </button>
                </div>
                <div className="px-2 flex-1 flex flex-col">
                  <h4 className="text-[11px] font-bold text-gray-800 leading-tight mb-1 h-7 line-clamp-2">{product.name}</h4>
                  <div className="mb-3 text-sm font-black text-blue-600">{product.price} ₽</div>
                  <ProductCounter product={product} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- VIEW: CART --- */}
      {view === 'cart' && (
        <div className="p-6 animate-in fade-in pb-40">
          <h1 className="text-3xl font-black mb-8 tracking-tighter italic uppercase">Корзина</h1>
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-300 font-bold">Корзина пуста</div>
          ) : (
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-[24px] border border-gray-100 shadow-sm">
                  <div className="flex-1 mr-4">
                    <div className="text-xs font-black text-gray-800">{item.name}</div>
                    <div className="text-[10px] text-blue-500 font-bold">{item.price} ₽ × {item.qty}</div>
                  </div>
                  <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-gray-50">
                    <button onClick={() => item.qty === 1 ? removeItem(item.id) : updateQty(item.id, -1)} className="p-1"><Minus size={14}/></button>
                    <span className="px-2 text-xs font-black w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1"><Plus size={14}/></button>
                  </div>
                </div>
              ))}
              <div className="space-y-4 pt-6 border-t">
                <input type="text" placeholder="Улица, дом, квартира" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold outline-none shadow-inner" value={address} onChange={e => setAddress(e.target.value)}/>
                <div className="bg-slate-900 p-6 rounded-[32px] text-white/50 space-y-2">
                  <div className="flex justify-between text-xs"><span>Товары</span><span className="text-white">{productsTotal} ₽</span></div>
                  <div className="flex justify-between text-xs"><span>Доставка</span><span className="text-white">{DELIVERY_FEE} ₽</span></div>
                  <div className="pt-2 mt-2 border-t border-white/10 flex justify-between items-center italic">
                    <span className="font-black text-white uppercase tracking-tighter">Итого</span>
                    <span className="text-2xl font-black text-white">{grandTotal} ₽</span>
                  </div>
                </div>
                <button onClick={createOrder} className="w-full bg-blue-600 text-white py-5 rounded-[28px] font-black text-sm shadow-xl shadow-blue-200 uppercase tracking-widest active:scale-95 transition">Заказать</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- VIEW: FAVORITES (ЭТАП 4) --- */}
      {view === 'favorites' && (
        <div className="p-6 animate-in fade-in">
          <h1 className="text-3xl font-black mb-8 tracking-tighter italic">ЛЮБИМОЕ</h1>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Магазины</h2>
          <div className="grid gap-3 mb-10">
            {stores.filter(s => storeIds.includes(s.id)).map(store => (
              <div key={store.id} onClick={() => openStore(store)} className="bg-gray-50 p-4 rounded-[28px] flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600"><Store size={20}/></div>
                  <div className="font-bold text-sm text-gray-800">{store.fullName}</div>
                </div>
                <ChevronRight size={16} className="text-gray-300"/>
              </div>
            ))}
            {storeIds.length === 0 && <p className="text-xs text-gray-300 italic">Список пуст</p>}
          </div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Товары</h2>
          <div className="grid grid-cols-2 gap-4">
             {products.filter(p => productIds.includes(p.id)).map(product => (
               <div key={product.id} className="bg-white rounded-[24px] border border-gray-100 p-2 shadow-sm" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="h-24 bg-gray-50 rounded-xl mb-2 overflow-hidden">
                    {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover" />}
                  </div>
                  <div className="px-1">
                    <div className="text-[10px] font-bold text-gray-800 truncate">{product.name}</div>
                    <div className="text-[11px] font-black text-blue-600 mt-1">{product.price} ₽</div>
                  </div>
               </div>
             ))}
             {productIds.length === 0 && <p className="text-xs text-gray-300 italic col-span-2">Список пуст</p>}
          </div>
        </div>
      )}

      {/* --- VIEW: ORDERS --- */}
      {view === 'orders' && (
        <div className="p-6">
          <h1 className="text-3xl font-black mb-8 tracking-tighter italic uppercase">История</h1>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex justify-between items-center shadow-sm">
                <div>
                  <div className="text-[9px] font-mono text-gray-400 mb-1">#{order.id.slice(0,8)}</div>
                  <div className="font-black text-[10px] uppercase text-blue-600">{order.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-gray-800">{order.totalAmount} ₽</div>
                  <div className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t px-10 py-5 flex justify-between items-center z-50 rounded-t-[32px] shadow-lg">
        <button onClick={() => setView('stores')} className={`flex flex-col items-center transition-all ${view === 'stores' || view === 'catalog' ? 'text-blue-600 scale-110' : 'text-gray-300'}`}>
          <Home size={22} className={view === 'stores' || view === 'catalog' ? 'fill-blue-50' : ''} />
          <span className="text-[8px] font-black mt-1.5 uppercase">Магазины</span>
        </button>
        <button onClick={() => setView('cart')} className={`flex flex-col items-center transition-all relative ${view === 'cart' ? 'text-blue-600 scale-110' : 'text-gray-300'}`}>
          <ShoppingCart size={22} className={view === 'cart' ? 'fill-blue-50' : ''} />
          {items.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-bounce shadow-md">{items.length}</span>}
          <span className="text-[8px] font-black mt-1.5 uppercase">Корзина</span>
        </button>
        <button onClick={() => setIsProfileOpen(true)} className="flex flex-col items-center text-gray-300">
          <User size={22} />
          <span className="text-[8px] font-black mt-1.5 uppercase">Профиль</span>
        </button>
      </div>

    </div>
  );
};

export default ClientDashboard;