export type UserRole = "superadmin" | "staff" | "cashier";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface TeaVariant {
  size: "Small" | "Large";
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  variants: TeaVariant[];
  image: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  size: "Small" | "Large";
  price: number;
  qty: number;
}