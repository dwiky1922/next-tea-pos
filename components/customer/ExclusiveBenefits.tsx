"use client";

import { useState } from "react";
import { Gift, Star, X, Info } from "lucide-react";

export default function ExclusiveBenefits() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div>
        <h3 className="text-xl font-black text-white mb-4">Keuntungan Eksklusif</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setShowModal(true)} className="bg-transparent border border-transparent hover:border-emerald-500/50 hover:bg-[#161C19] transition-all rounded-3xl p-6 text-left flex items-center gap-5 group shadow-md">
            <div className="w-14 h-14 bg-indigo-50 text-[#4318FF] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Gift size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">Tukar Poin Minuman</h4>
              <p className="text-slate-500 text-sm mt-0.5">1 minuman gratis setiap 100 poin. <span className="text-[#4318FF] text-xs ml-1 hover:underline">Lihat Detail &rarr;</span></p>
            </div>
          </button>

          <button onClick={() => setShowModal(true)} className="bg-transparent border border-transparent hover:border-amber-500/50 hover:bg-[#181A14] transition-all rounded-3xl p-6 text-left flex items-center gap-5 group shadow-md">
            <div className="w-14 h-14 bg-amber-950/50 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Star size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">Promo Khusus Member</h4>
              <p className="text-slate-500 text-sm mt-0.5">Potongan harga otomatis di setiap pembelian. <span className="text-amber-500 text-xs ml-1 hover:underline">Lihat Detail &rarr;</span></p>
            </div>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-700/80 shadow-2xl rounded-3xl w-full max-w-2xl relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border border-slate-100 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><Info className="text-[#4318FF]" /> Detail Keuntungan Member</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white bg-transparent hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="bg-transparent p-5 rounded-2xl border border-transparent">
                <h4 className="text-[#4318FF] font-bold mb-2 flex items-center gap-2"><Gift size={18} /> Sistem Tukar Poin Minuman</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Setiap akumulasi <span className="font-bold text-white bg-stone-800 px-2 py-0.5 rounded">100 Poin</span>, Anda berhak menukarkannya dengan 1 (satu) minuman gratis ukuran Small varian apa saja. Poin akan otomatis dipotong setelah penukaran di meja kasir. Informasikan kepada kasir jika ingin menukar poin.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Star className="text-amber-400" size={20}/> Tingkatan Tier & Diskon</h4>
                <div className="flex items-center justify-between bg-transparent p-4 rounded-xl border border-slate-100/50">
                  <div><p className="font-bold text-slate-800">Regular Member</p><p className="text-xs text-slate-400 mt-1">0 - 100 Pts</p></div>
                  <span className="text-slate-500 font-bold text-sm bg-stone-900 px-3 py-1 rounded-lg">Tanpa Diskon</span>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-[#121614] to-stone-900/30 p-4 rounded-xl border border-stone-700/50">
                  <div><p className="font-bold text-slate-800">Silver Member</p><p className="text-xs text-slate-400 mt-1">101 - 300 Pts</p></div>
                  <span className="text-[#4318FF] font-bold text-sm bg-indigo-50 border border-emerald-900/50 px-3 py-1 rounded-lg">Diskon 10%</span>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-[#121614] to-amber-900/20 p-4 rounded-xl border border-amber-900/30">
                  <div><p className="font-bold text-amber-500">Gold Member</p><p className="text-xs text-amber-600/70 mt-1">301 - 500 Pts</p></div>
                  <span className="text-amber-400 font-bold text-sm bg-amber-950/50 border border-amber-900/50 px-3 py-1 rounded-lg">Diskon 15%</span>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-[#121614] to-cyan-900/20 p-4 rounded-xl border border-cyan-900/30">
                  <div><p className="font-bold text-cyan-400">Platinum Member</p><p className="text-xs text-cyan-600/70 mt-1">501+ Pts</p></div>
                  <span className="text-cyan-400 font-bold text-sm bg-cyan-950/50 border border-cyan-900/50 px-3 py-1 rounded-lg">Diskon 20%</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border border-slate-100 border-t border-slate-100 text-center">
              <button onClick={() => setShowModal(false)} className="w-full bg-[#FF7043] hover:bg-[#e6653c] text-white font-bold py-3.5 rounded-xl transition-all shadow-md">Tutup Detail</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}