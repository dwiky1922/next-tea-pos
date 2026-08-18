"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gift, Star, Award, X, Info } from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  imageUrl: string;
  priceSmall: number;
  priceLarge: number;
}

export default function CustomerCatalog() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customerData, setCustomerData] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const initPortal = async () => {
      const rawData = localStorage.getItem("nextTea_customer");
      
      if (!rawData) {
        window.location.replace("/member-login");
        return;
      }

      try {
        const parsed = JSON.parse(rawData);
        const identity = parsed.username || parsed.contact || parsed.name;

        if (!identity) {
          window.location.replace("/member-login");
          return;
        }

        let validCustomer = parsed;
        const q = query(collection(db, "customers"), where("username", "==", identity));
        const snap = await getDocs(q);

        if (!snap.empty) {
          validCustomer = snap.docs[0].data();
        } else {
          const q2 = query(collection(db, "customers"), where("contact", "==", identity));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            validCustomer = snap2.docs[0].data();
          }
        }

        setCustomerData(validCustomer);

        const menuSnap = await getDocs(collection(db, "menus"));
        const list: MenuItem[] = [];
        menuSnap.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            name: data.name || "Menu",
            imageUrl: data.imageUrl || "",
            priceSmall: Number(data.priceSmall) || 0,
            priceLarge: Number(data.priceLarge) || 0,
          });
        });
        setMenus(list);
        
        setIsAuthChecking(false);

      } catch (err) {
        console.error("Gagal memuat portal:", err);
        window.location.replace("/member-login");
      }
    };

    initPortal();
  }, []);

  if (isAuthChecking) {
    return (
      <div className="flex-1 h-full bg-[#F4F7FE] flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customerData) return null;

  const points = customerData.points || 0;
  const userName = customerData.username || customerData.name || "Nama Member";

  let tier = "Regular Member";
  let discount = 0;

  if (points >= 501) { tier = "Platinum Member"; discount = 0.20; }
  else if (points >= 301) { tier = "Gold Member"; discount = 0.15; }
  else if (points >= 101) { tier = "Silver Member"; discount = 0.10; }

  const getProgressWidth = (pts: number) => {
    if (pts < 101) return (pts / 100) * 33.33;
    if (pts < 301) return 33.33 + ((pts - 101) / 200) * 33.33;
    if (pts < 501) return 66.66 + ((pts - 301) / 200) * 33.33;
    return 100;
  };

  const progressWidth = getProgressWidth(points);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#F4F7FE] text-slate-800 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Banner Profil - Full Ungu Bistro */}
        <div className="bg-[#4318FF] border border-transparent rounded-3xl p-8 shadow-[0_10px_30px_rgba(67,24,255,0.2)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-white">
            <Award size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-indigo-200 font-bold text-sm tracking-widest uppercase mb-1">Status Profil Member</p>
              <h1 className="text-4xl font-black text-white">{userName}</h1>
            </div>
            {discount > 0 && (
              <div className="bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 backdrop-blur-sm">
                <Star size={16} fill="currentColor" className="text-yellow-400" /> DISKON {discount * 100}% AKTIF
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-white/20 relative z-10">
            <div>
              <p className="text-indigo-200 font-bold text-[11px] uppercase tracking-widest mb-1">Tingkatan Member</p>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Star className={discount > 0 ? "text-yellow-400" : "text-indigo-200"} size={24} fill="currentColor" /> 
                {tier}
              </h2>
            </div>
            <div className="md:text-right">
              <p className="text-indigo-200 font-bold text-[11px] uppercase tracking-widest mb-1">Akumulasi Poin</p>
              <h2 className="text-3xl font-black text-white">{points} Pts</h2>
            </div>
          </div>
        </div>

        {/* Kartu Progress Tier */}
        <div className="bg-white border border-slate-50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">Perjalanan Tier Kamu</h3>
              <p className="text-slate-500 text-sm mt-1">Kumpulkan poin untuk naik level berikutnya!</p>
            </div>
            <span className="text-[#4318FF] font-bold bg-indigo-50 px-3 py-1 rounded-lg text-sm border border-indigo-100">{points} Pts</span>
          </div>
          
          <div className="relative pt-2">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#4318FF] transition-all duration-1000 ease-out rounded-full shadow-inner" 
                style={{ width: `${progressWidth}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
              <span className="w-1/4 text-left">REG (0)</span>
              <span className="w-1/4 text-center">SLV (101)</span>
              <span className="w-1/4 text-center">GLD (301)</span>
              <span className="w-1/4 text-right text-[#4318FF]">PLAT (501+)</span>
            </div>
          </div>
        </div>

        {/* Keuntungan Eksklusif */}
        <div>
          <h3 className="text-xl font-black text-slate-900 mb-4">Keuntungan Eksklusif</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setShowBenefitsModal(true)} className="bg-white border border-slate-50 hover:border-[#4318FF]/30 hover:bg-indigo-50/30 transition-all rounded-3xl p-6 text-left flex items-center gap-5 group shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-14 h-14 bg-indigo-50 text-[#4318FF] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Gift size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Tukar Poin Minuman</h4>
                <p className="text-slate-500 text-sm mt-0.5">1 minuman gratis setiap 100 poin. <span className="text-[#4318FF] text-xs ml-1 hover:underline">Lihat Detail &rarr;</span></p>
              </div>
            </button>

            <button onClick={() => setShowBenefitsModal(true)} className="bg-white border border-slate-50 hover:border-yellow-400/30 hover:bg-yellow-50/30 transition-all rounded-3xl p-6 text-left flex items-center gap-5 group shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-14 h-14 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Star size={24} fill="currentColor" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Promo Khusus Member</h4>
                <p className="text-slate-500 text-sm mt-0.5">Potongan harga otomatis di setiap pembelian. <span className="text-yellow-600 text-xs ml-1 hover:underline">Lihat Detail &rarr;</span></p>
              </div>
            </button>
          </div>
        </div>

        {/* Daftar Menu */}
        <div className="pt-4">
          <h2 className="text-2xl font-black text-slate-900 mb-1">Daftar Menu</h2>
          <p className="text-sm text-slate-500 mb-8">Harga di bawah ini otomatis terpotong sesuai tingkat keanggotaan Anda.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {menus.map((menu) => (
              <div key={menu.id} className="bg-white rounded-3xl border border-slate-50 overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1 duration-300">
                
                {/* Area Gambar (Tanpa Shadow Hitam) */}
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
                  {discount > 0 && (
                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-md">
                      Diskon {discount * 100}%
                    </div>
                  )}
                </div>
                
                {/* Area Teks (Diberi Background Putih agar Overlap -mt-6 nya bersih) */}
                <div className="p-6 flex flex-col items-center justify-center text-center -mt-6 relative z-10 flex-1 bg-white rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                  <h4 className="text-xl font-black text-slate-900 mb-5">{menu.name}</h4>
                  
                  <div className="w-full space-y-3 mt-auto">
                    <div className="flex justify-between items-center w-full border-b border-slate-100 pb-2">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">Small</span>
                      <div className="flex flex-col items-end">
                        {discount > 0 && (
                          <span className="text-slate-400 line-through text-[10px] font-medium">Rp {menu.priceSmall.toLocaleString('id-ID')}</span>
                        )}
                        <span className="text-[#4318FF] font-black text-sm">Rp {(menu.priceSmall * (1 - discount)).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">Large</span>
                      <div className="flex flex-col items-end">
                        {discount > 0 && (
                          <span className="text-slate-400 line-through text-[10px] font-medium">Rp {menu.priceLarge.toLocaleString('id-ID')}</span>
                        )}
                        <span className="text-[#4318FF] font-black text-sm">Rp {(menu.priceLarge * (1 - discount)).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL KEUNTUNGAN (Tanpa Oranye, Elegan & Terang) */}
      {showBenefitsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl w-full max-w-2xl relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Info className="text-[#4318FF]" /> Detail Keuntungan Member
              </h3>
              <button onClick={() => setShowBenefitsModal(false)} className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                <h4 className="text-[#4318FF] font-bold mb-2 flex items-center gap-2"><Gift size={18} /> Sistem Tukar Poin Minuman</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Setiap akumulasi <span className="font-bold text-[#4318FF] bg-white px-2 py-0.5 rounded shadow-sm">100 Poin</span>, Anda berhak menukarkannya dengan 1 (satu) minuman gratis ukuran Small varian apa saja. Poin akan otomatis dipotong setelah penukaran di meja kasir.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2"><Star className="text-yellow-500" size={20}/> Tingkatan Tier & Diskon Khusus</h4>
                
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">Regular Member</p>
                    <p className="text-xs text-slate-400 mt-1">0 - 100 Pts</p>
                  </div>
                  <span className="text-slate-500 font-bold text-sm bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">Tanpa Diskon</span>
                </div>

                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">Silver Member</p>
                    <p className="text-xs text-slate-400 mt-1">101 - 300 Pts</p>
                  </div>
                  <span className="text-[#4318FF] font-bold text-sm bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">Diskon 10%</span>
                </div>

                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">Gold Member</p>
                    <p className="text-xs text-slate-400 mt-1">301 - 500 Pts</p>
                  </div>
                  <span className="text-yellow-600 font-bold text-sm bg-yellow-50 border border-yellow-100 px-3 py-1 rounded-lg">Diskon 15%</span>
                </div>

                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800">Platinum Member</p>
                    <p className="text-xs text-slate-400 mt-1">501+ Pts</p>
                  </div>
                  <span className="text-purple-600 font-bold text-sm bg-purple-50 border border-purple-100 px-3 py-1 rounded-lg">Diskon 20%</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 text-center">
              <button onClick={() => setShowBenefitsModal(false)} className="w-full bg-[#4318FF] hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                Tutup Detail
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}