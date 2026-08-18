import MemberSidebar from "@/components/MemberSidebar";
import CustomerCatalog from "@/components/CustomerCatalog";

export default function Home() {
  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden">
      <MemberSidebar />
      <CustomerCatalog />
    </div>
  );
}