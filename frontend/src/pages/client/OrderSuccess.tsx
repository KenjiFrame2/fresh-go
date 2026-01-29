import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <CheckCircle size={48} />
      </div>
      
      <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">ОПЛАЧЕНО!</h1>
      <p className="text-gray-500 mb-12 max-w-xs mx-auto font-medium">
        Заказ <span className="text-blue-600 font-bold">#{orderId?.slice(0,8)}</span> успешно оплачен и передан в магазин.
      </p>

      <button 
        onClick={() => navigate('/')}
        className="w-full max-w-xs bg-blue-600 text-white py-5 rounded-[28px] font-black shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition"
      >
        ГЛАВНОЕ МЕНЮ <ArrowRight size={20}/>
      </button>
    </div>
  );
};

export default OrderSuccess;