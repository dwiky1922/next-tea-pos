"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, UserPlus, ArrowLeft, CheckCircle2, Coffee } from "lucide-react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CustomerRegisterPage() {
  const [username, setUsername] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !contact || !password) {
      alert("Mohon lengkapi semua kolom pendaftaran.");
      return;
    }

    try {
      setIsLoading(true);

      const q = query(collection(db, "customers"), where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("Username ini sudah digunakan. Silakan pilih username lain.");
        setIsLoading(false);
        return;
      }

      const newCustomer = {
        username: username,
        contact: contact,
        password: password,
        createdAt: new Date().toLocaleDateString("id-ID"),
        points: 0,
        tier: "Regular Member"
      };

      await addDoc(collection(db, "customers"), newCustomer);

      localStorage.setItem("nextTea_customer", JSON.stringify(newCustomer));
      localStorage.setItem("nextTea_last_identity", username);

      setModalMessage("Registrasi Berhasil! Akun Anda aktif dan langsung masuk ke halaman utama.");
      setIsModalOpen(true);

    } catch (error) {
      console.error("Gagal mendaftar:", error);
      alert("Terjadi kesalahan jaringan saat menyimpan data.");
      setIsLoading(false);
    }
  };

  const handleRedirectHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 relative font-sans overflow-hidden">
      
      {/* Ornamen Background Lembut */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-[#4318FF]/5 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-400/10 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 z-10 relative flex flex-col">
        
        {/* Header Kartu - Ungu Next Tea */}
        <div className="bg-[#4318FF] px-8 pt-10 pb-12 text-center relative text-white rounded-b-[2rem] shadow-lg z-10">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold px-3 py-1 rounded-full text-white tracking-wider uppercase shadow-sm">
            New Membership
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Coffee size={32} className="text-[#4318FF]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-1">Daftar Next Tea</h1>
          <p className="text-xs text-indigo-200 font-medium">
            Bergabunglah dan kumpulkan poin reward setiap pembelianmu.
          </p>
        </div>

        {/* Area Form Input */}
        <div className="px-8 pt-8 pb-8 bg-white text-slate-800 -mt-6 relative z-0">
          <form onSubmit={handleRegister} autoComplete="off" className="space-y-4">
            
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Username Baru
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-[#4318FF]" />
                </div>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Buat username unik..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:bg-white focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-bold placeholder-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Email / No. WhatsApp Aktif
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-[#4318FF]" />
                </div>
                <input 
                  type="text" 
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="budi@email.com / 0812xxxx"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:bg-white focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-bold placeholder-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Buat Kata Sandi
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-[#4318FF]" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:bg-white focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-bold placeholder-slate-400"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-6 py-4 bg-[#4318FF] hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                <>Daftar Sekarang <UserPlus size={16} className="group-hover:scale-110 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Sudah punya akun?{" "}
              <Link href="/member-login" className="text-[#4318FF] font-bold hover:underline inline-flex items-center gap-1 mt-1">
                <ArrowLeft size={14} /> Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modal Sukses */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-[#4318FF] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Registrasi Berhasil!</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">{modalMessage}</p>
            <button 
              onClick={handleRedirectHome}
              className="w-full py-3.5 bg-[#4318FF] hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Lanjutkan ke Katalog
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Sistem Pendaftaran Aman Next Tea
        </p>
      </div>
    </div>
  );
}