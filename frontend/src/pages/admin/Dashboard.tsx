import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { UserCheck, Clock, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    const res = await api.get('/users/pending');
    setPending(res.data);
  };

  const approve = async (id: string) => {
    await api.patch(`/users/${id}/approve`);
    alert("Пользователь подтвержден!");
    fetchPending();
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200"><ShieldAlert size={28}/></div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Панель управления</h1>
      </div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock /> Ожидают подтверждения ({pending.length})</h2>
      
      <div className="grid gap-4">
        {pending.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <div className="text-xs font-black text-blue-500 uppercase mb-1">{user.role}</div>
              <div className="text-lg font-bold text-gray-800">{user.fullName}</div>
              <div className="text-sm text-gray-400 font-mono">{user.phone}</div>
            </div>
            <button 
              onClick={() => approve(user.id)}
              className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-green-100 active:scale-95 transition-all flex items-center gap-2"
            >
              <UserCheck size={18}/> ПОДТВЕРДИТЬ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
