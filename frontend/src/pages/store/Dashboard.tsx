import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  PackageCheck, Play, Camera, CheckCircle2, XCircle, 
  MapPin, Box, Plus, Trash2, Edit3, Image as ImageIcon,
  Tag, ChevronRight
} from 'lucide-react';

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  address: string;
  comment?: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  oldPrice?: string;
  isActive: boolean;
  storeId: string;
  categoryId?: string;
  category?: { name: string };
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

const StoreDashboard = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Состояния для формы (Добавление/Редактирование)
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    oldPrice: '',
    categoryId: '',
    imageUrl: ''
  });
  
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    fetchCategories();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my/store');
      setOrders(res.data);
    } catch (err) { console.error("Ошибка заказов"); }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/products/my/inventory');
      setMyProducts(res.data);
    } catch (err) { console.error("Ошибка инвентаря"); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data);
    } catch (err) { console.error("Ошибка категорий"); }
  };

  const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Ошибка статуса");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: Number(formData.price),
      oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
      categoryId: formData.categoryId || null,
    };

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, data);
      } else {
        await api.post('/products', data);
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchInventory();
    } catch (err) { alert("Ошибка сохранения товара"); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Удалить товар навсегда? Это действие нельзя отменить.")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchInventory();
    } catch (err) { alert("Нельзя удалить товар, который есть в заказах. Лучше скройте его."); }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/products/${id}/toggle`);
      fetchInventory();
    } catch (err) { console.error("Ошибка переключения"); }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', oldPrice: '', categoryId: '', imageUrl: '' });
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      oldPrice: product.oldPrice?.toString() || '',
      categoryId: product.categoryId || '',
      imageUrl: product.imageUrl || ''
    });
    setShowModal(true);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black italic">F</div>
            <h1 className="text-xl font-black text-gray-800 tracking-tighter">STORE_PRO</h1>
          </div>
          <button onClick={logout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">ВЫХОД</button>
        </div>
        
        {/* Табы */}
        <div className="flex px-4 border-t">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-4 text-xs font-black transition-all ${activeTab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
          >
            ЗАКАЗЫ ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-4 text-xs font-black transition-all ${activeTab === 'inventory' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
          >
            ИНВЕНТАРЬ ({myProducts.length})
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.length === 0 && <div className="text-center py-20 text-gray-400 text-sm">Пока нет новых заказов</div>}
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-gray-300 block">#{order.id.slice(0,8)}</span>
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase mt-1">{order.status}</span>
                  </div>
                  <div className="text-xl font-black text-gray-800">{order.totalAmount} ₽</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl mb-5 flex items-start gap-3 border border-slate-100">
                  <MapPin size={16} className="text-orange-500 mt-1 flex-shrink-0" />
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800 block mb-1 underline decoration-orange-200">Адрес доставки:</span>
                    {order.address}
                    {order.comment && <div className="text-blue-500 mt-1 bg-white p-1.5 rounded-lg border border-blue-50 italic">"{order.comment}"</div>}
                  </div>
                </div>

                {/* Управление статусами */}
                <div className="space-y-2">
                  {order.status === 'WAITING_STORE' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusUpdate(order.id, 'STORE_ACCEPTED')} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-100 flex items-center justify-center gap-2"><CheckCircle2 size={18}/>Принять</button>
                      <button onClick={() => handleStatusUpdate(order.id, 'STORE_REJECTED')} className="px-6 bg-red-50 text-red-500 rounded-2xl font-bold"><XCircle size={20}/></button>
                    </div>
                  )}
                  {order.status === 'STORE_ACCEPTED' && (
                    <button onClick={() => handleStatusUpdate(order.id, 'ASSEMBLING')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100"><Play size={18}/>Начать сборку</button>
                  )}
                  {order.status === 'ASSEMBLING' && (
                    <div className="space-y-3">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50 cursor-pointer">
                        <Camera className="text-blue-500 mb-1" />
                        <span className="text-[10px] text-blue-600 font-black uppercase">Фото сборки</span>
                        <input type="file" className="hidden" />
                      </label>
                      <button onClick={() => handleStatusUpdate(order.id, 'READY_FOR_PICKUP')} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold">Готов к выдаче</button>
                    </div>
                  )}
                  {order.status === 'READY_FOR_PICKUP' && (
                    <button onClick={() => handleStatusUpdate(order.id, 'WAITING_COURIER')} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-100">Вызвать курьера <ChevronRight size={18}/></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}
              className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-100 active:scale-95 transition"
            >
              <Plus size={20}/> ДОБАВИТЬ ТОВАР
            </button>

            <div className="grid gap-4">
              {myProducts.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-50">
                      {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-300"/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1">{product.category?.name || 'Без категории'}</div>
                          <div className="font-bold text-gray-800 text-sm leading-tight">{product.name}</div>
                        </div>
                        <div className="text-right">
                          {product.oldPrice && <div className="text-[10px] text-red-400 line-through font-bold">{product.oldPrice} ₽</div>}
                          <div className="font-black text-orange-600">{product.price} ₽</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => openEdit(product)} className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-xl text-[10px] font-black border border-slate-100 flex items-center justify-center gap-1"><Edit3 size={12}/> ИЗМЕНИТЬ</button>
                        <button 
                          onClick={() => handleToggleActive(product.id)}
                          className={`px-3 py-2 rounded-xl font-black text-[10px] border transition-colors ${product.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-400 border-red-100'}`}
                        >
                          {product.isActive ? 'В ЭФИРЕ' : 'СКРЫТ'}
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО (ADD/EDIT) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-sm p-6 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter">{editingProduct ? 'РЕДАКТИРОВАТЬ' : 'НОВЫЙ ТОВАР'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-300"><XCircle size={24}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Название</label>
                <input 
                  type="text" required placeholder="Например: Свежий багет"
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Категория</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Цена (₽)</label>
                  <input 
                    type="number" required placeholder="0.00"
                    className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-orange-500"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Скидка (Старая цена)</label>
                  <input 
                    type="number" placeholder="Нет"
                    className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-orange-500"
                    value={formData.oldPrice} onChange={e => setFormData({...formData, oldPrice: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Описание</label>
                <textarea 
                  placeholder="Опишите товар..." rows={3}
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-orange-500"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Ссылка на фото (URL)</label>
                <input 
                  type="text" placeholder="https://..."
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-orange-500"
                  value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black text-sm mt-8 shadow-xl shadow-orange-100">
              СОХРАНИТЬ ИЗМЕНЕНИЯ
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StoreDashboard;


// import React, { useEffect, useState } from 'react';
// import api from '../../api/api';
// import { useAuthStore } from '../../store/useAuthStore';
// import {
//   PackageCheck,
//   Play,
//   Camera,
//   CheckCircle2,
//   XCircle,
//   MapPin,
//   Box,
//   Plus,
//   Trash2,
//   Edit
// } from 'lucide-react';

// interface Order {
//   id: string;
//   status: string;
//   totalAmount: string;
//   address: string;
//   comment?: string;
//   createdAt: string;
// }

// interface Product {
//   id: string;
//   name: string;
//   price: string;
//   isActive: boolean;
//   storeId: string;
// }

// interface Category {
//   id: string;
//   name: string;
// }

// const StoreDashboard = () => {
//   const logout = useAuthStore(state => state.logout);

//   const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [myProducts, setMyProducts] = useState<Product[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);

//   const [uploading, setUploading] = useState<string | null>(null);

//   const [showAddModal, setShowAddModal] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);

//   const [newProduct, setNewProduct] = useState<{
//     name: string;
//     price: string;
//     oldPrice?: string;
//     categoryId?: string;
//   }>({
//     name: '',
//     price: '',
//   });

//   /* ================== ЗАГРУЗКА ДАННЫХ ================== */

//   useEffect(() => {
//     fetchOrders();
//     fetchMyProducts();
//     api.get('/products/categories').then(res => setCategories(res.data));

//     const interval = setInterval(fetchOrders, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchOrders = async () => {
//     const res = await api.get('/orders/my/store');
//     setOrders(res.data);
//   };

//   const fetchMyProducts = async () => {
//     const res = await api.get('/products/my/inventory');
//     setMyProducts(res.data);
//   };

//   /* ================== ЗАКАЗЫ ================== */

//   const updateStatus = async (orderId: string, nextStatus: string) => {
//     await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
//     fetchOrders();
//   };

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
//     if (!e.target.files) return;
//     const formData = new FormData();
//     formData.append('file', e.target.files[0]);
//     formData.append('type', 'ASSEMBLY');
//     setUploading(orderId);
//     await api.post(`/orders/${orderId}/photos`, formData);
//     setUploading(null);
//   };

//   /* ================== ТОВАРЫ ================== */

//   const toggleProduct = async (id: string) => {
//     await api.patch(`/products/${id}/toggle`);
//     fetchMyProducts();
//   };

//   const saveProduct = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const data = {
//       ...newProduct,
//       price: Number(newProduct.price),
//       oldPrice: newProduct.oldPrice ? Number(newProduct.oldPrice) : null,
//     };

//     if (editingProduct) {
//       await api.patch(`/products/${editingProduct.id}`, data);
//     } else {
//       await api.post('/products', data);
//     }

//     setShowAddModal(false);
//     setEditingProduct(null);
//     setNewProduct({ name: '', price: '' });
//     fetchMyProducts();
//   };

//   const deleteProduct = async (id: string) => {
//     if (!window.confirm('Удалить товар навсегда?')) return;
//     await api.delete(`/products/${id}`);
//     fetchMyProducts();
//   };

//   const openEdit = (product: Product) => {
//     setEditingProduct(product);
//     setNewProduct({
//       name: product.name,
//       price: product.price,
//     });
//     setShowAddModal(true);
//   };

//   /* ================== UI ================== */

//   return (
//     <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
//       {/* HEADER */}
//       <div className="bg-white sticky top-0 z-20 shadow-sm">
//         <div className="p-4 flex justify-between items-center">
//           <h1 className="text-xl font-black text-orange-600">STORE_ADMIN</h1>
//           <button onClick={logout} className="text-red-500 text-sm font-bold">Выйти</button>
//         </div>
//         <div className="flex border-t">
//           <button
//             onClick={() => setActiveTab('orders')}
//             className={`flex-1 py-3 font-bold text-xs ${activeTab === 'orders'
//               ? 'text-orange-600 border-b-2 border-orange-600'
//               : 'text-gray-400'}`}
//           >
//             ЗАКАЗЫ ({orders.length})
//           </button>
//           <button
//             onClick={() => setActiveTab('products')}
//             className={`flex-1 py-3 font-bold text-xs ${activeTab === 'products'
//               ? 'text-orange-600 border-b-2 border-orange-600'
//               : 'text-gray-400'}`}
//           >
//             ИНВЕНТАРЬ ({myProducts.length})
//           </button>
//         </div>
//       </div>

//       {/* CONTENT */}
//       <div className="p-4">
//         {activeTab === 'orders' ? (
//           <div className="space-y-4">
//             {orders.map(order => (
//               <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm">
//                 <div className="flex justify-between mb-2">
//                   <div className="text-sm font-bold text-blue-600">{order.status}</div>
//                   <div className="font-bold">{order.totalAmount} ₽</div>
//                 </div>

//                 <div className="text-xs bg-gray-50 p-2 rounded-lg mb-3">
//                   <MapPin size={12} className="inline mr-1"/> {order.address}
//                 </div>

//                 {order.status === 'WAITING_STORE' && (
//                   <button
//                     onClick={() => updateStatus(order.id, 'STORE_ACCEPTED')}
//                     className="w-full bg-green-600 text-white py-2 rounded-lg font-bold"
//                   >
//                     Принять заказ
//                   </button>
//                 )}

//                 {order.status === 'ASSEMBLING' && (
//                   <>
//                     <input type="file" onChange={e => handleFileUpload(e, order.id)} />
//                     <button
//                       onClick={() => updateStatus(order.id, 'READY_FOR_PICKUP')}
//                       disabled={uploading === order.id}
//                       className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold mt-2"
//                     >
//                       Готов к выдаче
//                     </button>
//                   </>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="space-y-3">
//             <button
//               onClick={() => {
//                 setEditingProduct(null);
//                 setNewProduct({ name: '', price: '' });
//                 setShowAddModal(true);
//               }}
//               className="w-full bg-orange-100 text-orange-600 py-4 rounded-xl font-bold flex justify-center gap-2"
//             >
//               <Plus size={18}/> Добавить товар
//             </button>

//             {myProducts.map(product => (
//               <div key={product.id} className="bg-white p-4 rounded-xl flex justify-between">
//                 <div>
//                   <div className="font-bold">{product.name}</div>
//                   <div className="text-sm text-blue-600">{product.price} ₽</div>
//                 </div>
//                 <div className="flex gap-2">
//                   <button onClick={() => openEdit(product)}><Edit size={16}/></button>
//                   <button onClick={() => deleteProduct(product.id)}><Trash2 size={16}/></button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* MODAL */}
//       {showAddModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <form onSubmit={saveProduct} className="bg-white p-6 rounded-xl w-full max-w-xs">
//             <h2 className="font-bold mb-4">
//               {editingProduct ? 'Редактирование товара' : 'Новый товар'}
//             </h2>

//             <input
//               className="w-full p-2 bg-gray-100 rounded mb-2"
//               placeholder="Название"
//               value={newProduct.name}
//               onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
//               required
//             />

//             <input
//               type="number"
//               className="w-full p-2 bg-gray-100 rounded mb-4"
//               placeholder="Цена"
//               value={newProduct.price}
//               onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
//               required
//             />

//             <button className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold">
//               Сохранить
//             </button>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StoreDashboard;



// import React, { useEffect, useState } from 'react';
// import api from '../../api/api';
// import { useAuthStore } from '../../store/useAuthStore';
// import { PackageCheck, Play, Camera, CheckCircle2, XCircle, MapPin, Box, Plus, Trash2, Edit } from 'lucide-react';

// interface Order {
//   id: string;
//   status: string;
//   totalAmount: string;
//   address: string;
//   comment?: string;
//   createdAt: string;
// }

// interface Product {
//   id: string;
//   name: string;
//   price: string;
//   isActive: boolean;
//   storeId: string;
// }

// const StoreDashboard = () => {
//   const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [myProducts, setMyProducts] = useState<Product[]>([]);
//   const [uploading, setUploading] = useState<string | null>(null);
  
//   // Состояния для модального окна добавления товара
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [newProduct, setNewProduct] = useState({ name: '', price: '' });

//   // Добавь новые состояния
//   const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
//   const [editingProduct, setEditingProduct] = useState<any>(null);
//   const logout = useAuthStore(state => state.logout);

//   useEffect(() => {
//     fetchOrders();
//     fetchMyProducts();
//     const interval = setInterval(fetchOrders, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchOrders = async () => {
//     try {
//       const res = await api.get('/orders/my/store');
//       setOrders(res.data);
//     } catch (err) { console.error("Ошибка заказов"); }
//   };

//   const fetchMyProducts = async () => {
//     try {
//       const res = await api.get('/products/my/inventory');
//       setMyProducts(res.data);
//     } catch (err) { console.error("Ошибка инвентаря"); }
//   };

//   const updateStatus = async (orderId: string, nextStatus: string) => {
//     try {
//       await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
//       fetchOrders();
//     } catch (err: any) {
//       alert(err.response?.data?.message || "Ошибка статуса");
//     }
//   };

//   const toggleProduct = async (id: string) => {
//     try {
//       await api.patch(`/products/${id}/toggle`);
//       fetchMyProducts();
//     } catch (err) { alert("Ошибка переключения товара"); }
//   };

//   const addProduct = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await api.post('/products', {
//         name: newProduct.name,
//         price: Number(newProduct.price)
//       });
//       setNewProduct({ name: '', price: '' });
//       setShowAddModal(false);
//       fetchMyProducts();
//     } catch (err) { alert("Ошибка при добавлении товара"); }
//   };

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
//     if (!e.target.files) return;
//     const formData = new FormData();
//     formData.append('file', e.target.files[0]);
//     formData.append('type', 'ASSEMBLY');
//     setUploading(orderId);
//     try {
//       await api.post(`/orders/${orderId}/photos`, formData);
//       alert("Фото загружено!");
//     } catch (err) { alert("Ошибка загрузки"); }
//     finally { setUploading(null); }
//   };

//   return (
//     <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
//       {/* Header & Tabs */}
//       <div className="bg-white sticky top-0 z-20 shadow-sm">
//         <div className="p-4 flex justify-between items-center">
//           <h1 className="text-xl font-black text-orange-600 tracking-tighter">STORE_ADMIN</h1>
//           <button onClick={logout} className="text-red-500 text-sm font-bold">Выйти</button>
//         </div>
//         <div className="flex border-t">
//           <button 
//             onClick={() => setActiveTab('orders')}
//             className={`flex-1 py-3 font-bold text-xs transition ${activeTab === 'orders' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
//           >
//             ЗАКАЗЫ ({orders.length})
//           </button>
//           <button 
//             onClick={() => setActiveTab('products')}
//             className={`flex-1 py-3 font-bold text-xs transition ${activeTab === 'products' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
//           >
//             ИНВЕНТАРЬ ({myProducts.length})
//           </button>
//         </div>
//       </div>

//       <div className="p-4">
//         {activeTab === 'orders' ? (
//           <div className="space-y-4">
//             {orders.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Нет активных заказов</div>}
//             {orders.map(order => (
//               <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
//                 <div className="flex justify-between items-start mb-3">
//                   <div>
//                     <div className="text-[10px] font-mono text-gray-400 uppercase">#{order.id.slice(0,8)}</div>
//                     <div className="font-black text-blue-600 text-sm">{order.status}</div>
//                   </div>
//                   <div className="text-right font-bold text-lg">{order.totalAmount} ₽</div>
//                 </div>

//                 <div className="bg-gray-50 p-3 rounded-xl mb-4 flex items-start gap-2 border border-gray-100">
//                   <MapPin size={14} className="text-gray-400 mt-0.5" />
//                   <div className="text-[11px] text-gray-600">
//                     <span className="font-bold block text-gray-800">Доставить по адресу:</span>
//                     {order.address}
//                     {order.comment && <div className="text-blue-500 italic mt-1">"{order.comment}"</div>}
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   {order.status === 'WAITING_STORE' && (
//                     <div className="grid grid-cols-2 gap-2">
//                       <button onClick={() => updateStatus(order.id, 'STORE_ACCEPTED')} className="bg-green-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><CheckCircle2 size={16}/>Принять</button>
//                       <button onClick={() => updateStatus(order.id, 'STORE_REJECTED')} className="bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><XCircle size={16}/>Отказ</button>
//                     </div>
//                   )}
//                   {order.status === 'STORE_ACCEPTED' && (
//                     <button onClick={() => updateStatus(order.id, 'ASSEMBLING')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm">Начать сборку</button>
//                   )}
//                   {order.status === 'ASSEMBLING' && (
//                     <div className="space-y-3">
//                       <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 cursor-pointer">
//                         <Camera className="text-blue-500 mb-1" />
//                         <span className="text-[10px] text-blue-600 font-bold uppercase">Загрузить фото сборки</span>
//                         <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, order.id)} />
//                       </label>
//                       <button onClick={() => updateStatus(order.id, 'READY_FOR_PICKUP')} disabled={uploading === order.id} className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold disabled:opacity-50">Готов к выдаче</button>
//                     </div>
//                   )}
//                   {order.status === 'READY_FOR_PICKUP' && (
//                     <button onClick={() => updateStatus(order.id, 'WAITING_COURIER')} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold">Вызвать курьера</button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <button 
//               onClick={() => setShowAddModal(true)}
//               className="w-full bg-orange-50 text-orange-600 py-4 rounded-2xl font-bold border-2 border-dashed border-orange-200 flex items-center justify-center gap-2"
//             >
//               <Plus size={20}/> Добавить товар
//             </button>

//             <div className="grid gap-3">
//               {myProducts.map(product => (
//                 <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
//                   <div className="flex items-center gap-3">
//                     <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><Box size={20}/></div>
//                     <div>
//                       <div className="font-bold text-sm">{product.name}</div>
//                       <div className="text-xs text-blue-600 font-medium">{product.price} ₽</div>
//                     </div>
//                   </div>
//                   <button 
//                     onClick={() => toggleProduct(product.id)}
//                     className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase transition-colors ${product.isActive ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}
//                   >
//                     {product.isActive ? 'В наличии' : 'Нет в наличии'}
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* MODAL */}
//       {showAddModal && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <form onSubmit={addProduct} className="bg-white w-full max-w-xs p-6 rounded-3xl shadow-2xl">
//             <h2 className="text-xl font-black mb-4 text-gray-800">Новый товар</h2>
//             <div className="space-y-3 mb-6">
//               <input 
//                 type="text" placeholder="Название товара" required
//                 className="w-full p-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
//                 value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
//               />
//               <input 
//                 type="number" placeholder="Цена (₽)" required
//                 className="w-full p-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
//                 value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}
//               />
//             </div>
//             <div className="flex gap-2">
//               <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-400 font-bold text-sm">Отмена</button>
//               <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200">Создать</button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StoreDashboard;
