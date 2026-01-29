import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import api from '../../api/api';

const PaymentSimulator = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const orderId = params.get('orderId');
  const amount = params.get('amount');

  const handlePay = async () => {
    setLoading(true);
    try {
      // Имитируем подтверждение оплаты на бэкенд
      // В реальности ЮKassa прислала бы Webhook, но мы сделаем прямой вызов для теста
      await api.patch(`/orders/${orderId}/status`, { status: 'PAID' });
      
      setTimeout(() => {
        navigate(`/order-success?orderId=${orderId}`);
      }, 1500);
    } catch (err) {
      alert("Ошибка платежа");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="flex justify-center mb-4 text-blue-200"><ShieldCheck size={48}/></div>
          <h2 className="text-xl font-black tracking-tight">ТЕСТОВЫЙ ШЛЮЗ</h2>
          <p className="text-blue-100 text-xs opacity-80 uppercase font-bold mt-2 tracking-widest text-[9px]">Безопасная оплата заказа</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Сумма к оплате</span>
            <span className="text-4xl font-black text-gray-900">{amount} ₽</span>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
               <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Номер карты</div>
               <div className="flex items-center gap-3 text-gray-400 font-mono italic">
                 <CreditCard size={20}/> 4000 0000 0000 0002
               </div>
            </div>

            <button 
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : "ОПЛАТИТЬ"}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <Lock size={12}/> <span className="text-[10px] font-bold uppercase tracking-tighter">Защищено SSL шифрованием</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulator;