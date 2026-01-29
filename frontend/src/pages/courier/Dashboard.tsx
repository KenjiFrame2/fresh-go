import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Truck, MapPin, Camera, Navigation, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  deliveryFee: string;
  store?: { fullName: string };
}

const CourierDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Получаем свободные заказы
      const available = await api.get('/orders/available/courier');
      setAvailableOrders(available.data);
      
      // 2. Получаем заказы, которые ЭТОТ курьер уже взял в работу
      const myActive = await api.get('/orders/my/courier');
      setMyOrders(myActive.data);
      
      console.log("Доступно:", available.data.length, "В работе:", myActive.data.length);
    } catch (err) {
      console.error("Ошибка загрузки данных курьера");
    }
  };

  const getGeo = (): Promise<{lat: number, lon: number}> => {
    return new Promise((resolve, reject) => {
      setLoadingGeo(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoadingGeo(false);
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          setLoadingGeo(false);
          alert("Включите GPS для работы");
          reject(err);
        }
      );
    });
  };

  const handleStatusUpdate = async (orderId: string, status: string, needGeo = false) => {
    try {
      let payload: any = { status };
      if (needGeo) {
        const coords = await getGeo();
        payload = { ...payload, ...coords };
      }
      await api.patch(`/orders/${orderId}/status`, payload);
      fetchData();
    } catch (err: any) {
      alert("Ошибка: " + (err.response?.data?.message || "Действие отклонено"));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string, type: string) => {
    if (!e.target.files) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', type);
    try {
      await api.post(`/orders/${orderId}/photos`, formData);
      alert("Фото сохранено");
    } catch (err) {
      alert("Ошибка загрузки фото");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold flex items-center gap-2"><Truck /> Такси-Курьер</h1>
        <button onClick={logout} className="text-xs bg-slate-800 px-3 py-1 rounded">Выйти</button>
      </div>

      <div className="p-4 space-y-6">
        {/* СВОБОДНЫЕ ЗАКАЗЫ */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-widest">Доступно для доставки</h2>
          {availableOrders.length === 0 && <div className="text-slate-400 text-center py-4 bg-white rounded-xl border-dashed border-2">Нет заказов поблизости</div>}
          {availableOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-3">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg text-slate-800">{order.deliveryFee} ₽</div>
                <div className="text-xs text-slate-400 font-mono">#{order.id.slice(0,8)}</div>
              </div>
              <button 
                onClick={() => handleStatusUpdate(order.id, 'COURIER_ACCEPTED')}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
              >
                Принять заказ
              </button>
            </div>
          ))}
        </section>

        {/* МОИ ТЕКУЩИЕ ЗАКАЗЫ */}
        <section>
          <h2 className="text-sm font-bold text-blue-500 uppercase mb-3 tracking-widest">Мой активный заказ</h2>
          {myOrders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-blue-500">
                <div className="mb-4">
                    <div className="text-xs text-slate-400 uppercase">Статус:</div>
                    <div className="text-xl font-black text-slate-800">{order.status}</div>
                </div>

                {/* Внутри карточки заказа (myOrders.map) */}
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-2 text-blue-800">
                        <MapPin size={18} className="mt-1 flex-shrink-0" />
                        <div>
                            <div className="font-bold text-sm">{order.address}</div>
                            {order.comment && (
                                <div className="text-xs text-blue-600 mt-1">
                                {order.comment}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

              <div className="grid gap-3">
                {order.status === 'COURIER_ACCEPTED' && (
                  <div className="space-y-3">
                    <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50">
                      <Camera className="mr-2 text-slate-400"/> <span className="font-bold">Фото при получении</span>
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, order.id, 'PICKUP')} />
                    </label>
                    <button 
                      onClick={() => handleStatusUpdate(order.id, 'PICKED_UP', true)}
                      className="w-full bg-orange-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"
                    >
                      {loadingGeo ? "Проверка GPS..." : "Я забрал заказ"}
                    </button>
                  </div>
                )}

                {order.status === 'PICKED_UP' && (
                  <button 
                    onClick={() => handleStatusUpdate(order.id, 'IN_DELIVERY')}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black"
                  >
                    Поехал к клиенту
                  </button>
                )}

                {order.status === 'IN_DELIVERY' && (
                  <div className="space-y-3">
                    <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl cursor-pointer">
                      <Camera className="mr-2 text-slate-400"/> <span className="font-bold">Фото у клиента</span>
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, order.id, 'DELIVERY')} />
                    </label>
                    <button 
                      onClick={() => handleStatusUpdate(order.id, 'DELIVERED', true)}
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-black"
                    >
                      Доставлено
                    </button>
                  </div>
                )}
                
                {order.status === 'DELIVERED' && (
                  <div className="text-center p-4 bg-green-50 text-green-700 rounded-xl font-bold flex items-center justify-center gap-2">
                    <CheckCircle /> Ожидание подтверждения...
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default CourierDashboard;