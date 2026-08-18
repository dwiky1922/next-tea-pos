"use client";

import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, CreditCard, ShoppingBag, TrendingUp, Package, Crown } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboardPage() {
  const { inventory } = useData();

  const [weeklyStats, setWeeklyStats] = useState({ revenue: 0, transactions: 0, cupsSold: 0 });
  const [allTimeMenuSales, setAllTimeMenuSales] = useState<Record<string, number>>({});
  const [dynamicChartData, setDynamicChartData] = useState([
    { name: "Senin", mingguIni: 0, mingguKemarin: 0 },
    { name: "Selasa", mingguIni: 0, mingguKemarin: 0 },
    { name: "Rabu", mingguIni: 0, mingguKemarin: 0 },
    { name: "Kamis", mingguIni: 0, mingguKemarin: 0 },
    { name: "Jumat", mingguIni: 0, mingguKemarin: 0 },
    { name: "Sabtu", mingguIni: 0, mingguKemarin: 0 },
    { name: "Minggu", mingguIni: 0, mingguKemarin: 0 },
  ]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "transactions"), (snapshot) => {
      let revThisWeek = 0;
      let trxThisWeek = 0;
      let cupsThisWeek = 0;
      const allTimeSales: Record<string, number> = {};

      const weekData = [
        { name: "Senin", mingguIni: 0, mingguKemarin: 0 },
        { name: "Selasa", mingguIni: 0, mingguKemarin: 0 },
        { name: "Rabu", mingguIni: 0, mingguKemarin: 0 },
        { name: "Kamis", mingguIni: 0, mingguKemarin: 0 },
        { name: "Jumat", mingguIni: 0, mingguKemarin: 0 },
        { name: "Sabtu", mingguIni: 0, mingguKemarin: 0 },
        { name: "Minggu", mingguIni: 0, mingguKemarin: 0 },
      ];

      const now = new Date();
      const dayOfWeek = now.getDay() || 7; 
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);
      const endOfLastWeek = new Date(endOfWeek);
      endOfLastWeek.setDate(endOfWeek.getDate() - 7);

      const months: Record<string, number> = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "Mei": 4, "Jun": 5, "Jul": 6, "Agu": 7, "Sep": 8, "Okt": 9, "Nov": 10, "Des": 11 };

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.status === "Berhasil") {
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: { name?: string; qty?: number; quantity?: number }) => {
              const itemQty = Number(item.qty) || Number(item.quantity) || 1;
              if (item.name) {
                allTimeSales[item.name] = (allTimeSales[item.name] || 0) + itemQty;
              }
            });
          }

          if (data.date) {
            try {
              const parts = data.date.replace(",", "").split(" ");
              const d = parseInt(parts[0]);
              const m = months[parts[1]];
              const y = parseInt(parts[2]);
              
              if (!isNaN(d) && m !== undefined && !isNaN(y)) {
                const trxDate = new Date(y, m, d);
                const trxTime = trxDate.getTime();
                const dayIdx = trxDate.getDay();
                const chartIdx = dayIdx === 0 ? 6 : dayIdx - 1; 

                if (trxTime >= startOfWeek.getTime() && trxTime <= endOfWeek.getTime()) {
                  revThisWeek += Number(data.total) || 0;
                  trxThisWeek++;

                  if (data.items && Array.isArray(data.items)) {
                    data.items.forEach((item: { qty?: number; quantity?: number }) => {
                      cupsThisWeek += Number(item.qty) || Number(item.quantity) || 1;
                    });
                  }
                  weekData[chartIdx].mingguIni += Number(data.total) || 0;
                } 
                else if (trxTime >= startOfLastWeek.getTime() && trxTime <= endOfLastWeek.getTime()) {
                  weekData[chartIdx].mingguKemarin += Number(data.total) || 0;
                }
              }
            } catch (e) {
              console.error("Format tanggal tidak dikenali:", data.date);
            }
          }
        }
      });

      setWeeklyStats({ revenue: revThisWeek, transactions: trxThisWeek, cupsSold: cupsThisWeek });
      setAllTimeMenuSales(allTimeSales);
      setDynamicChartData(weekData);
    });

    return () => unsubscribe();
  }, []);

  const sortedMenus = Object.entries(allTimeMenuSales)
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold);

  const top6Menus = sortedMenus.slice(0, 6);
  const starProduct = sortedMenus.length > 0 ? sortedMenus[0] : null;

  const today = new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="h-full overflow-y-auto bg-[#F4F7FE] text-slate-800 p-8 relative z-0 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Pantau performa penjualan secara dinamis.</p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-full border border-slate-100 text-sm font-bold text-[#4318FF] shadow-sm">
          {today}
        </div>
      </div>

      {/* 4 Cards Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
         {/* Pemasukan */}
         <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1">
           <div className="w-12 h-12 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center mb-5"><DollarSign size={24} strokeWidth={2.5} /></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pemasukan Minggu Ini</p>
           <h3 className="text-3xl font-black text-slate-900">Rp {weeklyStats.revenue.toLocaleString("id-ID")}</h3>
         </div>
         
         {/* Transaksi (Menggunakan aksen Sky Blue agar harmonis dengan ungu) */}
         <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1">
           <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-5"><CreditCard size={24} strokeWidth={2.5} /></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transaksi Minggu Ini</p>
           <h3 className="text-3xl font-black text-slate-900">{weeklyStats.transactions} <span className="text-sm font-bold text-slate-400">struk</span></h3>
         </div>

         {/* Cup Terjual */}
         <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1">
           <div className="w-12 h-12 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center mb-5"><ShoppingBag size={24} strokeWidth={2.5} /></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cup Terjual (Minggu Ini)</p>
           <h3 className="text-3xl font-black text-slate-900">{weeklyStats.cupsSold} <span className="text-sm font-bold text-slate-400">cup</span></h3>
         </div>
         
         {/* Card Produk Bintang (Menggunakan Ungu Solid agar menyatu dengan Sidebar) */}
         <div className="bg-[#4318FF] p-6 rounded-3xl shadow-[0_10px_20px_rgba(67,24,255,0.2)] relative overflow-hidden text-white transition-transform hover:-translate-y-1">
           <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5 backdrop-blur-sm"><Crown size={24} strokeWidth={2.5} /></div>
           <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">Best Seller (All Time)</p>
           {starProduct ? (
             <>
               <h3 className="text-2xl font-black truncate">{starProduct.name}</h3>
               <p className="text-sm font-bold text-white mt-1">{starProduct.sold} Orders</p>
             </>
           ) : (
             <h3 className="text-sm font-bold text-indigo-200 mt-2">Belum ada data</h3>
           )}
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          
          {/* Grafik Pembanding */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-96 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Statistics (Minggu Ini vs Lalu)</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', color: '#0f172a', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: '900' }} />
                  {/* Garis Minggu Ini: Ungu, Garis Minggu Lalu: Abu-abu netral */}
                  <Line type="monotone" dataKey="mingguIni" name="Minggu Ini" stroke="#4318FF" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#4318FF', strokeWidth: 3, stroke: '#fff' }} />
                  <Line type="monotone" dataKey="mingguKemarin" name="Minggu Lalu" stroke="#94a3b8" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-8 mt-6">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-[#4318FF]"></div> Revenue</div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Last Week</div>
            </div>
          </div>

          {/* Peringkat Menu Utama */}
          <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">Popular Orders (All Time)</h3>
            {top6Menus.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {top6Menus.map((menu, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-[#4318FF]/30 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{menu.name}</p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">{menu.sold} Orders</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#4318FF]/10 flex items-center justify-center font-black text-[#4318FF] text-sm">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="w-full py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-sm font-bold text-slate-400">Belum ada data penjualan menu tercatat.</p>
               </div>
            )}
          </div>
        </div>

        {/* Panel Stok Inventaris */}
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 rounded-3xl flex flex-col h-full">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Package size={20} className="text-[#4318FF]" /> Inventory</h3>
             <span className="text-[10px] font-bold uppercase tracking-wider text-[#4318FF] bg-indigo-50 px-3 py-1.5 rounded-full">Real-Time</span>
           </div>
           
           <div className="flex-1 space-y-6 overflow-y-auto pr-2 pb-4">
             {inventory.map((item, idx) => {
               // Warna indikator fungsional (Semantic UI) yang lebih lembut
               let badgeColor = "bg-slate-100 text-slate-600";
               if (item.status === "Aman") badgeColor = "bg-emerald-100 text-emerald-700";
               if (item.status === "Cukup") badgeColor = "bg-blue-100 text-blue-700";
               if (item.status === "Menipis") badgeColor = "bg-amber-100 text-amber-700";
               if (item.status === "Habis") badgeColor = "bg-red-100 text-red-700";

               return (
                 <div key={idx}>
                   <div className="flex justify-between items-end mb-2.5">
                     <div>
                       <span className="text-sm font-bold text-slate-900 block mb-1">{item.name}</span>
                       <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-bold ${badgeColor}`}>
                         {item.status}
                       </span>
                     </div>
                     <div className="text-right">
                       <span className="text-slate-900 font-black text-sm">{item.stock}</span>
                       <span className="text-slate-400 font-bold text-xs ml-1">{item.unit}</span>
                     </div>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full transition-all ${
                          item.status === "Aman" ? "bg-[#4318FF]" : 
                          item.status === "Cukup" ? "bg-indigo-400" : 
                          item.status === "Menipis" ? "bg-amber-400" : "bg-red-500"
                        }`} 
                        style={{ width: `${Math.min((item.stock / item.maxStock) * 100, 100)}%` }}
                      ></div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

      </div>
    </div>
  );
}