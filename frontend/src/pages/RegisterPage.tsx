import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Phone, Lock, User, ShoppingBag, Truck } from 'lucide-react';
import api from '../api/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ phone: '', password: '', fullName: '', role: 'CLIENT' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.access_token) {
        // Если это клиент — сразу входим
        localStorage.setItem('token', res.data.access_token);
        const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
        localStorage.setItem('role', payload.role);
        window.location.href = '/';
      } else {
        setMsg(res.data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Ошибка регистрации");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-10">
        <h1 className="text-3xl font-black mb-2 tracking-tighter">Регистрация</h1>
        <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-8">Создать новый аккаунт</p>

        {msg ? (
          <div className="bg-blue-50 text-blue-600 p-6 rounded-3xl text-center font-bold animate-pulse">
            {msg}
            <button onClick={() => navigate('/')} className="block w-full mt-4 bg-blue-600 text-white py-3 rounded-xl">К логину</button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
              {['CLIENT', 'STORE', 'COURIER'].map(r => (
                <button 
                  key={r} type="button"
                  onClick={() => setFormData({...formData, role: r})}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${formData.role === r ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                >
                  {r === 'CLIENT' ? 'Я КЛИЕНТ' : r === 'STORE' ? 'МАГАЗИН' : 'КУРЬЕР'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Ваше имя" required className="w-full p-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}/>
              <input type="text" placeholder="Телефон" required className="w-full p-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
              <input type="password" placeholder="Пароль" required className="w-full p-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4">
              ЗАРЕГИСТРИРОВАТЬСЯ
            </button>
            <p className="text-center text-xs text-gray-400 font-bold">
              Уже есть аккаунт? <Link to="/" className="text-blue-500">Войти</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;