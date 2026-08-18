"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AlertCircle, X } from "lucide-react";

interface User {
  uid: string;
  name: string;
  role: string;
  email: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Peringatan Kustom (Menggantikan alert browser)
  const [warningModal, setWarningModal] = useState({ isOpen: false, title: "", message: "" });
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase();
        let role = "Unknown";
        let name = "Pengguna";
        let status = "Non-Aktif"; 

        try {
          const q = query(collection(db, "users"), where("email", "==", email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            name = docData.name || name;
            role = docData.role || role;
            status = docData.status || (email.includes("admin") ? "Aktif" : "Non-Aktif");
          }
        } catch (e) {
          console.error("Gagal mengambil data dari Firestore:", e);
        }

        // Auto-Kick jika akun dinonaktifkan oleh Admin saat sesi masih berjalan
        if (status === "Non-Aktif" && !email.includes("admin")) {
            await firebaseSignOut(auth);
            setUser(null);
            localStorage.removeItem("nextTeaUser");
            setLoading(false);
            router.replace("/login");
            return;
        }

        const loggedInUser: User = { uid: firebaseUser.uid, email, role, name, status };
        setUser(loggedInUser);
        localStorage.setItem("nextTeaUser", JSON.stringify(loggedInUser));
      } else {
        setUser(null);
        localStorage.removeItem("nextTeaUser");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInEmail = userCredential.user.email?.toLowerCase() || "";

      // 1. CEK STATUS AKUN DI FIRESTORE SEBELUM MENGIZINKAN MASUK
      const q = query(collection(db, "users"), where("email", "==", loggedInEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
         const docData = querySnapshot.docs[0].data();
         const status = docData.status || (loggedInEmail.includes("admin") ? "Aktif" : "Non-Aktif");
         
         // Jika statusnya Non-Aktif, hentikan proses login & tampilkan modal kustom
         if (status === "Non-Aktif" && !loggedInEmail.includes("admin")) {
             await firebaseSignOut(auth);
             setWarningModal({
               isOpen: true,
               title: "Akses Ditolak",
               message: "Akun Anda sedang Offline / Non-Aktif. Harap tunggu Admin mengaktifkannya."
             });
             return; 
         }
      }

      // 2. Arahkan rute jika status Aktif
      if (loggedInEmail.includes("@admin.ac.id")) {
        router.push("/admin/dashboard");
      } else if (loggedInEmail.includes("@cashier.ac.id")) {
        router.push("/cashier/transaction");
      } else if (loggedInEmail.includes("@staff.ac.id")) {
        router.push("/staff/inventory");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (error: unknown) {
      console.error("Firebase Login Error:", error);
      setWarningModal({
        isOpen: true,
        title: "Login Gagal",
        message: "Akses Ditolak! Email atau Kata Sandi yang Anda masukkan salah."
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem("nextTeaUser");
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Firebase Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}

      {/* MODAL PERINGATAN KUSTOM (Menggantikan alert tradisional browser) */}
      {warningModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setWarningModal({ isOpen: false, title: "", message: "" })} 
              className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">{warningModal.title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              {warningModal.message}
            </p>

            <button 
              onClick={() => setWarningModal({ isOpen: false, title: "", message: "" })}
              className="w-full py-4 bg-[#4318FF] hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)] cursor-pointer active:scale-[0.98]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);