"use client";

import { useState } from "react";
import { Leaf, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Email dan Kata Sandi wajib diisi!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Mengirim Email DAN Password ke Firebase melalui AuthContext
      await login(email, password);
      // Jika berhasil, tidak perlu set loading false karena halaman akan berpindah
    } catch {
      // Jika gagal/salah sandi, matikan animasi loading agar user bisa coba lagi
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#F4F7FE] selection:bg-[#4318FF]/20 p-4 overflow-hidden font-sans">
      
      {/* Ornamen Background Lembut (Bukan Oranye, melainkan Biru/Ungu Pastel) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-[#4318FF]/5 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-400/10 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md z-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Header Kartu - Ungu Bistro Solid */}
        <div className="bg-[#4318FF] px-8 pt-12 pb-14 text-center relative overflow-hidden rounded-b-[2rem] shadow-lg z-10">
          
          {/* Badge Admin */}
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
            <ShieldCheck size={14} className="text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Admin Portal</span>
          </div>

          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-white/10 rounded-full blur-2xl opacity-50"></div>
          
          {/* Ikon Logo */}
          <div className="relative z-10 h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
            <Leaf size={32} className="text-[#4318FF]" strokeWidth={2.5} />
          </div>
          
          <h2 className="relative z-10 text-3xl font-black text-white tracking-tight mb-1">Next Tea System</h2>
          <p className="relative z-10 text-indigo-200 text-sm font-medium">Masuk untuk mengelola kasir & operasional</p>
        </div>

        {/* Area Form Input */}
        <div className="px-8 pt-8 pb-8 bg-white -mt-6 relative z-0">
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Alamat Email / Kode Akses
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-[#4318FF]" />
                </div>
                <input
                  type="email"
                  name="email_akses" 
                  autoComplete="off" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="@admin.ac.id"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-[#4318FF] focus:bg-white focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-bold text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-[#4318FF]" />
                </div>
                <input
                  type="password"
                  name="sandi_baru"
                  autoComplete="new-password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-[#4318FF] focus:bg-white focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-bold text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full mt-4 bg-[#4318FF] hover:bg-indigo-700 text-white font-bold text-sm py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk ke Sistem
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
              Sistem Internal Terenkripsi Next Tea.<br/>
              Akses sangat terbatas untuk Karyawan Terdaftar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}