"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface InventoryItem { id: string; itemId?: string; name: string; category: string; stock: number; maxStock: number; unit: string; status: string; barColor: string; }
export interface Transaction { id: string; date: string; time?: string; cashier: string; customer: string; method: string; total: number; status: string; type?: string; items?: CartItem[]; }
export interface Stats { revenue: number; transactions: number; cupsSold: number; }
export interface CartItem { id: string; name: string; size: "Small" | "Large"; price: number; qty: number; }
export interface ChartData { name: string; revenue: number; expenses: number; }
export interface MenuItem { id: string; name: string; priceSmall: number; priceLarge: number; imageUrl: string; }

interface DataContextType {
  inventory: InventoryItem[];
  transactions: Transaction[];
  stats: Stats;
  chartData: ChartData[];
  menuSales: Record<string, number>;
  menus: MenuItem[];
  loadingMenus: boolean;
  processCheckout: (cart: CartItem[], total: number, cashierName: string) => Promise<void>;
  restockItem: (id: string, amount: number, cost: number) => Promise<void>;
  addCustomExpense: (description: string, amount: number, cashierName: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  
  const [stats, setStats] = useState<Stats>({ revenue: 0, transactions: 0, cupsSold: 0 });
  const [menuSales, setMenuSales] = useState<Record<string, number>>({});
  
  const daysList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  
  const initialChart: ChartData[] = [
    { name: "Senin", revenue: 0, expenses: 0 }, { name: "Selasa", revenue: 0, expenses: 0 },
    { name: "Rabu", revenue: 0, expenses: 0 }, { name: "Kamis", revenue: 0, expenses: 0 },
    { name: "Jumat", revenue: 0, expenses: 0 }, { name: "Sabtu", revenue: 0, expenses: 0 },
    { name: "Minggu", revenue: 0, expenses: 0 },
  ];

  const [chartData, setChartData] = useState<ChartData[]>(initialChart);

  useEffect(() => {
    // 1. Fetch Inventory
    const invUnsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const invData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
      invData.sort((a, b) => a.name.localeCompare(b.name));
      setInventory(invData);
    });

    // 2. Fetch Transactions
    const trxQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
    const trxUnsub = onSnapshot(trxQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
    });

    // 3. Fetch Dashboard Stats
    const dashRef = doc(db, "dashboard", "main_stats");
    const dashUnsub = onSnapshot(dashRef, (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data().stats);
        setChartData(docSnap.data().chartData);
        setMenuSales(docSnap.data().menuSales || {});
      } else {
        setDoc(dashRef, { stats: { revenue: 0, transactions: 0, cupsSold: 0 }, chartData: initialChart, menuSales: {} });
      }
    });

    // 4. Fetch Menus (Dengan Auto-Seed jika kosong)
    const menuUnsub = onSnapshot(collection(db, "menus"), async (snapshot) => {
      if (snapshot.empty) {
        // Jika database menu kosong, otomatis buatkan data default!
        const defaultMenus = [
          { name: "Ice Tea", priceSmall: 3000, priceLarge: 6000, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80" },
          { name: "Milk Tea", priceSmall: 6000, priceLarge: 8000, imageUrl: "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=500&q=80" },
          { name: "Lemon Tea", priceSmall: 5000, priceLarge: 9000, imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80" },
          { name: "Lychee Tea", priceSmall: 5000, priceLarge: 8000, imageUrl: "https://images.unsplash.com/photo-1595981267035-7b04d84d82f3?w=500&q=80" },
          { name: "Peach Tea", priceSmall: 8000, priceLarge: 12000, imageUrl: "https://images.unsplash.com/photo-1506544777-64cfbeaebf94?w=500&q=80" },
          { name: "Yakult Tea", priceSmall: 10000, priceLarge: 15000, imageUrl: "https://images.unsplash.com/photo-1587841966141-86e417cd5d5e?w=500&q=80" }
        ];
        defaultMenus.forEach(async (m) => await addDoc(collection(db, "menus"), m));
      } else {
        const menuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
        // Sort abjad agar rapi
        menuData.sort((a, b) => a.name.localeCompare(b.name));
        setMenus(menuData);
        setLoadingMenus(false);
      }
    });

    return () => { invUnsub(); trxUnsub(); dashUnsub(); menuUnsub(); };
  }, []);

  const getTodayChartIndex = () => {
    const dayStr = daysList[new Date().getDay()];
    const mapping: Record<string, number> = { "Senin": 0, "Selasa": 1, "Rabu": 2, "Kamis": 3, "Jumat": 4, "Sabtu": 5, "Minggu": 6 };
    return mapping[dayStr] ?? 1;
  };

  const processCheckout = async (cart: CartItem[], total: number, cashierName: string) => {
    try {
      const totalCups = cart.reduce((sum, item) => sum + item.qty, 0);
      const activeIdx = getTodayChartIndex();

      const newStats = { revenue: stats.revenue + total, transactions: stats.transactions + 1, cupsSold: stats.cupsSold + totalCups };
      const newChart = [...chartData];
      newChart[activeIdx] = { ...newChart[activeIdx], revenue: newChart[activeIdx].revenue + total };
      
      const newMenuSales = { ...menuSales };
      cart.forEach(item => { newMenuSales[item.name] = (newMenuSales[item.name] || 0) + item.qty; });
      
      await updateDoc(doc(db, "dashboard", "main_stats"), { stats: newStats, chartData: newChart, menuSales: newMenuSales });

      const now = new Date();
      await addDoc(collection(db, "transactions"), {
        id: `#TRX-${Math.floor(1000 + Math.random() * 9000)}`,
        date: now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
        cashier: cashierName,
        customer: "Pelanggan Umum",
        method: "QRIS / Tunai",
        total: total,
        status: "Berhasil",
        type: "Pemasukan",
        items: cart
      });

      let deductGula = 0, deductTeh = 0, deductSusu = 0, deductYakult = 0, deductLemon = 0, deductLeci = 0, deductPersik = 0;
      cart.forEach(c => {
        const isLarge = c.size === "Large"; const q = c.qty;
        deductGula += (isLarge ? 0.03 : 0.02) * q; deductTeh += (isLarge ? 0.03 : 0.02) * q;  
        if (c.name.includes("Milk")) deductSusu += (isLarge ? 0.15 : 0.10) * q; 
        if (c.name.includes("Yakult")) deductYakult += (isLarge ? 0.4 : 0.2) * q; 
        if (c.name.includes("Lemon")) deductLemon += (isLarge ? 0.05 : 0.03) * q; 
        if (c.name.includes("Lychee")) deductLeci += (isLarge ? 0.05 : 0.03) * q;
        if (c.name.includes("Peach")) deductPersik += (isLarge ? 0.05 : 0.03) * q;
      });

      const updatePromises: Promise<void>[] = [];
      inventory.forEach(item => {
        let deductAmount = 0;
        const smallCups = cart.filter(c => c.size === "Small").reduce((s, c) => s + c.qty, 0);
        const largeCups = cart.filter(c => c.size === "Large").reduce((s, c) => s + c.qty, 0);
        
        if (item.name === "Cup Small") deductAmount = smallCups;
        if (item.name === "Cup Large") deductAmount = largeCups;
        if (item.name === "Gula") deductAmount = deductGula;
        if (item.name === "Teh Kantong") deductAmount = deductTeh;
        if (item.name === "Susu") deductAmount = deductSusu;
        if (item.name === "Yakult") deductAmount = deductYakult;
        if (item.name === "Sirup Lemon") deductAmount = deductLemon;
        if (item.name === "Sirup Leci") deductAmount = deductLeci;
        if (item.name === "Sirup Persik") deductAmount = deductPersik;

        if (deductAmount > 0) {
          const newStock = Math.max(0, Number((item.stock - deductAmount).toFixed(2)));
          const percentage = (newStock / item.maxStock) * 100;
          let newStatus = "Aman"; let newColor = "bg-emerald-500";
          if (percentage <= 20) { newStatus = "Kritis"; newColor = "bg-rose-500"; }
          else if (percentage <= 40) { newStatus = "Menipis"; newColor = "bg-amber-500"; }
          else if (percentage <= 60) { newStatus = "Cukup"; newColor = "bg-teal-500"; }

          updatePromises.push(updateDoc(doc(db, "inventory", item.id), { stock: newStock, status: newStatus, barColor: newColor }));
        }
      });
      await Promise.all(updatePromises);
    } catch (error) { console.error("Gagal Checkout:", error); }
  };

  const restockItem = async (docId: string, amount: number, cost: number) => {
    try {
      const itemToUpdate = inventory.find(i => i.id === docId);
      if (!itemToUpdate) return;
      const activeIdx = getTodayChartIndex();

      const newStats = { ...stats, revenue: stats.revenue - cost };
      const newChart = [...chartData];
      newChart[activeIdx] = { ...newChart[activeIdx], expenses: newChart[activeIdx].expenses + cost }; 
      await updateDoc(doc(db, "dashboard", "main_stats"), { stats: newStats, chartData: newChart });

      const now = new Date();
      await addDoc(collection(db, "transactions"), { id: `#OUT-${Math.floor(1000 + Math.random() * 9000)}`, date: now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }), cashier: "Staff Inventory", customer: "Supplier", method: `Restock ${itemToUpdate.name}`, total: cost, status: "Berhasil", type: "Pengeluaran" });

      const newStock = itemToUpdate.stock + amount;
      const realPercentage = (newStock / itemToUpdate.maxStock) * 100;
      let newStatus = "Aman"; let newColor = "bg-emerald-500";
      if (realPercentage <= 20) { newStatus = "Kritis"; newColor = "bg-rose-500"; } else if (realPercentage <= 40) { newStatus = "Menipis"; newColor = "bg-amber-500"; } else if (realPercentage <= 60) { newStatus = "Cukup"; newColor = "bg-teal-500"; }

      await updateDoc(doc(db, "inventory", docId), { stock: newStock, status: newStatus, barColor: newColor });
    } catch (error) { console.error("Gagal Restock:", error); }
  };

  const addCustomExpense = async (description: string, amount: number, cashierName: string) => {
    try {
      const activeIdx = getTodayChartIndex();
      const newStats = { ...stats, revenue: stats.revenue - amount };
      const newChart = [...chartData];
      newChart[activeIdx] = { ...newChart[activeIdx], expenses: newChart[activeIdx].expenses + amount }; 
      
      await updateDoc(doc(db, "dashboard", "main_stats"), { stats: newStats, chartData: newChart });
      const now = new Date();
      await addDoc(collection(db, "transactions"), { id: `#OUT-${Math.floor(1000 + Math.random() * 9000)}`, date: now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }), cashier: cashierName, customer: "Operasional", method: description, total: amount, status: "Berhasil", type: "Pengeluaran" });
    } catch (error) { console.error("Gagal mencatat pengeluaran:", error); }
  };

  return (
    <DataContext.Provider value={{ inventory, transactions, stats, chartData, menuSales, menus, loadingMenus, processCheckout, restockItem, addCustomExpense }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData harus digunakan di dalam DataProvider");
  return context;
};