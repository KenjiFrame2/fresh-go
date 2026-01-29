import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Импортируем Link
import api from '../api/api';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn, Phone, Lock } from 'lucide-react';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { phone, password });
      const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
      setAuth(res.data.access_token, payload.role);
    } catch (err: any) {
      alert('Ошибка входа: ' + (err.response?.data?.message || 'Проверьте данные'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-10 border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <LogIn size={32} />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-center mb-2 tracking-tighter uppercase">Войти</h1>
        <p className="text-gray-400 text-[10px] text-center font-black uppercase tracking-[0.2em] mb-10">С возвращением в FreshGO</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-4 top-4 text-gray-300" size={18} />
            <input 
              type="text" placeholder="Телефон" 
              className="w-full bg-slate-50 p-4 pl-12 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              value={phone} onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-300" size={18} />
            <input 
              type="password" placeholder="Пароль" 
              className="w-full bg-slate-50 p-4 pl-12 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all mt-6 uppercase tracking-widest">
            Войти в систему
          </button>
        </form>

        {/* --- ССЫЛКА НА РЕГИСТРАЦИЮ --- */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">
            Нет аккаунта? 
            <Link to="/register" className="ml-2 text-blue-600 hover:underline">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;