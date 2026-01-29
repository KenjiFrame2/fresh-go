import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, Clock, Star, Info, ShieldCheck } from 'lucide-react';
import api from '../../api/api';

const StoreInfoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    api.get(`/users/stores/${id}`).then(res => setStore(res.data)).catch(() => navigate('/'));
  }, [id]);

  if (!store) return <div className="p-10 text-center font-bold">Загрузка...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 border-b sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black tracking-tighter">О МАГАЗИНЕ</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Card */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-100">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">{store.fullName}</h2>
          <div className="flex items-center justify-center gap-1 text-orange-500 font-black text-sm">
            <Star size={16} fill="currentColor" /> 4.9 <span className="text-gray-300 font-bold ml-1">• 100+ заказов</span>
          </div>
        </div>

        {/* Details List */}
        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
          <div className="p-6 flex items-start gap-4 border-b border-gray-50">
            <div className="p-3 bg-gray-50 rounded-2xl text-blue-600"><Clock size={20}/></div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">График работы</div>
              <div className="text-sm font-bold text-gray-800">Ежедневно: 08:00 — 22:00</div>
              <div className="text-[10px] text-green-500 font-bold mt-1 uppercase">Открыто сейчас</div>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4 border-b border-gray-50">
            <div className="p-3 bg-gray-50 rounded-2xl text-blue-600"><MapPin size={20}/></div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Адрес</div>
              <div className="text-sm font-bold text-gray-800">Центральный район, ул. Ленина, д. 15</div>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4">
            <div className="p-3 bg-gray-50 rounded-2xl text-blue-600"><Phone size={20}/></div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Телефон</div>
              <div className="text-sm font-bold text-gray-800">{store.phone}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-blue-600 p-8 rounded-[40px] text-white">
          <h3 className="text-lg font-black mb-3 flex items-center gap-2 italic uppercase">
            <Info size={20}/> О нас
          </h3>
          <p className="text-blue-100 text-sm leading-relaxed font-medium">
            Мы работаем только с проверенными поставщиками. Каждый продукт проходит ручную проверку перед отправкой в доставку. Наша цель — привезти вам продукты так быстро, как будто вы сходили за ними сами.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoreInfoPage;