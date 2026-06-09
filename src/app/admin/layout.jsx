import AdminSidebar from "../../components/layout/AdminSidebar";

export const metadata = {
  title: "Admin - J&A Supplements"
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-900">
      <AdminSidebar />
      <div className="ml-64 min-h-screen p-8">{children}</div>
    </div>
  );
}
