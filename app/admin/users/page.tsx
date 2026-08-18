"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Plus, Shield, UserX, UserCheck, X, CheckCircle2 } from "lucide-react";

// Tipe Data User
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  password?: string;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Modal Tambah User
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [newName, setNewName] = useState("");
  const [username, setUsername] = useState("");
  const [newRole, setNewRole] = useState("Kasir");
  const [newPassword, setNewPassword] = useState("");

  // Mengambil data pengguna secara Real-time dari Firebase
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("role", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      setUsers(usersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fungsi penentu domain email berdasarkan Role
  const getDomain = (role: string) => {
    if (role === "Super Admin") return "@admin.ac.id";
    if (role === "Staff Inventory") return "@staff.ac.id";
    return "@cashier.ac.id";
  };

  // Auto-generate Email
  const generatedEmail = username ? `${username.toLowerCase().replace(/\s/g, '')}${getDomain(newRole)}` : "";

  // Fungsi Tambah Pengguna Baru
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !username || !newPassword) return;

    try {
      setIsSubmitting(true);
      
      // Menambahkan data ke koleksi "users" di Firestore
      await addDoc(collection(db, "users"), {
        name: newName,
        email: generatedEmail,
        role: newRole,
        password: newPassword, // Disimpan untuk keperluan simulasi login custom
        status: "Aktif (Bisa Login)"
      });

      // Reset Form & Tutup Modal
      setNewName("");
      setUsername("");
      setNewPassword("");
      setNewRole("Kasir");
      setShowAddModal(false);
    } catch (error) {
      console.error("Gagal menambahkan pengguna:", error);
      alert("Terjadi kesalahan sistem!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi Toggle Aktif / Non-Aktif
  const toggleUserStatus = async (userId: string, currentStatus: string, role: string) => {
    if (role === "Super Admin") {
      return alert("Akses Super Admin bersifat permanen dan tidak bisa dinonaktifkan!");
    }
    
    try {
      const newStatus = currentStatus === "Aktif (Bisa Login)" ? "Non-Aktif" : "Aktif (Bisa Login)";
      await updateDoc(doc(db, "users", userId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Gagal mengubah status:", error);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F4F7FE] text-slate-900 p-6 md:p-8 relative z-0 flex flex-col font-sans">
      
      {/* Ornamen Background */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#4318FF]/5 blur-[120px]"></div>
      </div>

      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Users className="text-[#4318FF]" size={32} />
            Kelola Pengguna Sistem
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Atur hak akses, peran, dan status akun staf secara real-time.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#4318FF] hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)]"
        >
          <Plus size={18} /> Tambah Pengguna Baru
        </button>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] border border-slate-100 flex flex-col overflow-hidden mb-8 flex-1">
        <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Shield size={18} className="text-[#4318FF]" /> Daftar Akun Staf & Administrator
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            Total <span className="text-[#4318FF] font-black">{users.length}</span> akun terdaftar
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                <th className="px-6 py-5 font-bold">Email (ID)</th>
                <th className="px-6 py-5 font-bold">Nama Karyawan</th>
                <th className="px-6 py-5 font-bold">Peran (Role)</th>
                <th className="px-6 py-5 font-bold text-center">Status Akun</th>
                <th className="px-6 py-5 font-bold text-center">Kontrol Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-medium bg-slate-50/50">
                    <div className="w-8 h-8 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5 font-bold text-[#4318FF]">{user.email}</td>
                    <td className="px-6 py-5 font-bold text-slate-900">{user.name}</td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide shadow-sm">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 flex justify-center">
                      {user.status === "Aktif (Bisa Login)" ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center w-max gap-1.5 shadow-sm">
                          <UserCheck size={14} /> Aktif (Bisa Login)
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center w-max gap-1.5 shadow-sm">
                          <UserX size={14} /> Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {user.role === "Super Admin" ? (
                        <span className="text-xs italic text-slate-400 font-medium">Permanen</span>
                      ) : (
                        <button 
                          onClick={() => toggleUserStatus(user.id, user.status, user.role)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm mx-auto flex items-center gap-2 ${
                            user.status === "Aktif (Bisa Login)" 
                              ? "bg-white border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200" 
                              : "bg-white border-slate-200 text-[#4318FF] hover:bg-indigo-50 hover:border-indigo-200"
                          }`}
                        >
                          {user.status === "Aktif (Bisa Login)" ? "Matikan Akses" : "Aktifkan Akses"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP MODAL TAMBAH PENGGUNA BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Shield size={20} className="text-[#4318FF]" /> Tambah Pengguna
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Buat kredensial login staf baru.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Form Konten */}
            <form onSubmit={handleAddUser} className="p-6 space-y-5 bg-slate-50/50">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Nama Lengkap Karyawan</label>
                <input 
                  type="text" required placeholder="Cth: Dwiky Abyantara"
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Username</label>
                  <input 
                    type="text" required placeholder="Cth: dwiky"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Peran (Role)</label>
                  <select 
                    value={newRole} onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium appearance-none"
                  >
                    <option value="Kasir">Kasir</option>
                    <option value="Staff Inventory">Staff Inventory</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Preview Auto-Generated Email */}
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email ID yang Dihasilkan (Otomatis):</p>
                <p className="text-sm font-black text-[#4318FF]">
                  {generatedEmail || "ketik username..."}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Kata Sandi (Password)</label>
                <input 
                  type="text" required placeholder="Buat kata sandi..."
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium placeholder-slate-400"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-4 flex items-center justify-center gap-2 text-white font-bold text-sm rounded-2xl transition-all ${
                    isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-[#4318FF] hover:bg-indigo-700 shadow-[0_8px_20px_rgba(67,24,255,0.25)]"
                  }`}
                >
                  {isSubmitting ? "Menyimpan..." : <><CheckCircle2 size={18} /> Simpan & Daftarkan Akses</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}