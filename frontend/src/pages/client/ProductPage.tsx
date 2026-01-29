import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import api from '../../api/api';
import { useCartStore } from '../../store/useCartStore';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const { items, addItem, updateQty, removeItem } = useCartStore();

  const cartItem = items.find(i => i.id === id);

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data)).catch(() => navigate('/'));
  }, [id]);

  if (!product) return <div className="p-10 text-center font-bold">Загрузка...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-24 font-sans">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto p-4 flex items-center justify-between z-50">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-800">
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Product Image */}
      <div className="relative h-96 bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Package size={120} />
          </div>
        )}
        {product.oldPrice && (
          <div className="absolute bottom-6 left-6 bg-red-500 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
            <Tag size={16}/> ВЫГОДНО
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-8 -mt-10 bg-white rounded-t-[48px] relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
              {product.category?.name || 'Другое'} • {product.store?.fullName}
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{product.name}</h1>
          </div>
          <div className="text-right">
             {product.oldPrice && <div className="text-xs text-gray-300 line-through font-bold">{product.oldPrice} ₽</div>}
             <div className="text-2xl font-black text-blue-600">{product.price} ₽</div>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-8" />

        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Описание продукта</h3>
        <p className="text-gray-500 leading-relaxed font-medium mb-10">
          {product.description || "Производитель не указал подробное описание товара. Мы гарантируем свежесть и высокое качество этого продукта."}
        </p>

        {/* Action Button / Counter */}
        {!cartItem ? (
          <button 
            onClick={() => addItem(product)}
            className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-sm shadow-2xl shadow-blue-200 active:scale-95 transition flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <ShoppingCart size={20}/> Добавить в корзину
          </button>
        ) : (
          <div className="flex items-center justify-between bg-blue-50 p-2 rounded-[32px] border border-blue-100 shadow-inner">
            <button 
              onClick={() => cartItem.qty === 1 ? removeItem(product.id) : updateQty(product.id, -1)}
              className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-blue-600 shadow-sm active:scale-90 transition"
            >
              <Minus size={24} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-blue-600 leading-none">{cartItem.qty}</span>
              <span className="text-[8px] font-black text-blue-400 uppercase mt-1">шт в корзине</span>
            </div>
            <button 
              onClick={() => updateQty(product.id, 1)}
              className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-blue-200 active:scale-90 transition"
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;