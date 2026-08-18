"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coffee, User, Lock, ArrowRight, X, AlertCircle } from "lucide-react";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CustomerLoginPage() {
  const router = useRouter();
  
  const [identity, setIdentity] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nextTea_last_identity") || "";
    }
    return "";
  });
  
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [warningTitle, setWarningTitle] = useState("Pemberitahuan");
  const [warningMessage, setWarningMessage] = useState("");
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isRegisterPrompt, setIsRegisterPrompt] = useState(false);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const showAlert = (title: string, msg: string, suggestRegister = false) => {
    setWarningTitle(title);
    setWarningMessage(msg);
    setIsRegisterPrompt(suggestRegister);
    setIsWarningOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !password) {
      showAlert("Peringatan", "Mohon isi username/email dan kata sandi Anda.");
      return;
    }

    setIsLoading(true);

    try {
      const querySnapshot = await getDocs(collection(db, "customers"));
      let matchedCustomer: DocumentData | null = null;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data) {
          const dbUser = String(data.name || data.username || "").trim().toLowerCase();
          const dbContact = String(data.contact || "").trim().toLowerCase();
          const inputVal = identity.trim().toLowerCase();

          if (dbUser === inputVal || dbContact === inputVal) {
            matchedCustomer = data;
          }
        }
      });

      if (!matchedCustomer) {
        setIsLoading(false);
        showAlert(
          "Akun Tidak Ditemukan", 
          "Maaf, akun dengan identitas tersebut belum terdaftar di sistem kami. Silakan lakukan pendaftaran terlebih dahulu.",
          true
        );
        return;
      }

      try {
        localStorage.setItem("nextTea_customer", JSON.stringify(matchedCustomer));
        localStorage.setItem("nextTea_user", JSON.stringify(matchedCustomer)); 
        localStorage.setItem("nextTea_last_identity", identity);
      } catch {}

      window.location.href = "/";

    } catch (error: unknown) {
      console.error("Gagal melakukan login:", error);
      setIsLoading(false);
      showAlert("Kesalahan Sistem", "Gagal terhubung ke database. Periksa koneksi internet Anda.");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#F4F7FE] selection:bg-[#4318FF]/20 p-4 overflow-hidden font-sans">
      
      {/* Ornamen Background Lembut */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-[#4318FF]/5 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-400/10 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md z-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Header Kartu - Ungu Solid Elegan */}
        <div className="bg-[#4318FF] px-8 pt-12 pb-14 text-center relative overflow-hidden rounded-b-[2rem] shadow-lg z-10">
          
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Customer Portal</span>
          </div>

          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-white/10 rounded-full blur-2xl opacity-50"></div>
          
          <div className="relative z-10 h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
            <Coffee size={32} className="text-[#4318FF]" strokeWidth={2.5} />
          </div>
          <h2 className="relative z-10 text-3xl font-black text-white tracking-tight mb-1">Next Tea Member</h2>
          <p className="relative z-10 text-indigo-200 text-sm font-medium">Masuk untuk memesan minuman dan kumpulkan poin loyalitasmu.</p>
        </div>

        {/* Area Form Input */}
        <div className="px-8 pt-8 pb-8 bg-white -mt-6 relative z-0">
          <form onSubmit={handleLogin} autoComplete="off" className="space-y-5">
            
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Username / Email / No. WhatsApp
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-[#4318FF]" />
                </div>
                <input 
                  type="text" 
                  required
                  name="cust_login_id_xyz"
                  autoComplete="off"
                  data-lpignore="true"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="Cth: Reza Pratama atau 0877..."
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
                  required
                  name="cust_login_pass_xyz"
                  autoComplete="new-password"
                  data-lpignore="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-[#4318FF] focus:bg-white focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-bold text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-[#4318FF] hover:bg-indigo-700 text-white font-bold text-sm py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memverifikasi Akun...</span>
                </div>
              ) : (
                <>Masuk Sekarang <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button 
              type="button"
              onClick={() => { setForgotSent(false); setForgotEmail(""); setIsForgotOpen(true); }}
              className="text-[11px] font-bold text-slate-400 hover:text-[#4318FF] transition-colors bg-transparent border-none cursor-pointer"
            >
              Lupa Kata Sandi?
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Belum punya akun?{" "}
              <Link href="/member-register" className="text-[#4318FF] font-bold hover:underline">
                Daftar sekarang!
              </Link>
            </p>
          </div>

        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Sistem Loyalitas Pelanggan Terenkripsi Next Tea
        </p>
      </div>

      {/* MODAL PERINGATAN */}
      {isWarningOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isRegisterPrompt ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-500"}`}>
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{warningTitle}</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">{warningMessage}</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => setIsWarningOpen(false)}
                className="w-full py-4 bg-[#4318FF] hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md cursor-pointer"
              >
                Mengerti / Coba Lagi
              </button>
              {isRegisterPrompt && (
                <Link 
                  href="/member-register"
                  className="block w-full py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition-all text-center"
                >
                  Daftar Akun Baru Sekarang
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LUPA KATA SANDI */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Reset Kata Sandi</h3>
              <button onClick={() => setIsForgotOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {forgotSent ? (
              <div className="py-4 text-center">
                <p className="text-lg font-black text-[#4318FF] mb-2">Instruksi Berhasil Dikirim!</p>
                <p className="text-sm text-slate-500 mb-8 font-medium">Silakan periksa email/WhatsApp Anda di <strong className="text-slate-900">{forgotEmail}</strong>.</p>
                <button onClick={() => setIsForgotOpen(false)} className="w-full py-4 bg-[#4318FF] hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl cursor-pointer shadow-md transition-all">Tutup</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="text-sm font-medium text-slate-500">Masukkan Email atau No. WhatsApp terdaftar Anda.</p>
                <div>
                  <input 
                    type="text" 
                    required 
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    placeholder="Email / No. WhatsApp..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:bg-white focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-bold"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-[#4318FF] hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)] cursor-pointer">
                  Kirim Instruksi Reset
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}