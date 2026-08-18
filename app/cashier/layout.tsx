"use client";

import { ShoppingCart, BarChart3, LogOut, Leaf } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth(); 
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      const storedUser = localStorage.getItem("nextTeaUser");
      if (!storedUser) {
        router.replace("/login"); 
      } else {
        setIsAuthorized(true);
      }
    };
    checkAccess();
  }, [router]);

  if (!isAuthorized || !user) {
    return (
      <div className="h-screen w-full bg-[#F4F7FE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 bg-[#4318FF]/10 border border-[#4318FF]/20 rounded-2xl flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(67,24,255,0.2)]">
            <Leaf size={28} className="text-[#4318FF]" />
          </div>
          <p className="text-xs font-black text-[#4318FF]/70 animate-pulse tracking-widest uppercase">
            Memverifikasi Akses...
          </p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Kasir & Transaksi", icon: ShoppingCart, path: "/cashier/transaction" },
    { name: "Laporan Keuangan", icon: BarChart3, path: "/cashier/reports" },
  ];

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans selection:bg-[#4318FF]/30">
      <aside className="w-64 bg-[#4318FF] text-white flex flex-col z-20 relative shadow-2xl md:rounded-r-[2.5rem] flex-shrink-0">
        
        <div className="p-8 flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#4318FF] shadow-sm">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Next Tea</h1>
            <p className="text-[9px] text-indigo-200 font-bold tracking-widest uppercase mt-0.5">POS Kasir</p>
          </div>
        </div>

        <div className="mx-5 mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 flex items-center justify-between relative z-10 shadow-sm">
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-white/70 font-bold mt-0.5 capitalize">Role: {user.role}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse flex-shrink-0"></div>
        </div>

        <nav className="flex-1 px-5 py-2 space-y-2 relative z-10 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link key={item.name} href={item.path}>
                <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 ${
                  isActive ? "bg-white text-[#4318FF] shadow-md scale-[1.02]" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}>
                  <item.icon size={20} className={isActive ? "text-[#4318FF]" : "text-white/70"} />
                  <span className="text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 relative z-10 mt-auto">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-rose-500 text-white transition-all border border-transparent shadow-sm cursor-pointer group">
            <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <span className="text-xs font-black text-white">{getInitial(user.name)}</span>
            </div>
            <span className="text-sm font-bold">Keluar Sistem</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
        {children}
      </main>
    </div>
  );
}