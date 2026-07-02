import type { Metadata } from "next";
import "@/app/globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserContextProvider } from "@/contexts/user-context";

export const metadata: Metadata = {
  title: "SAHABAT AI - Akses Hak Sosial Indonesia",
  description: "Platform AI untuk membantu warga Indonesia memahami dan mengakses hak-hak sosial mereka",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserContextProvider>
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <div className="w-full px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </UserContextProvider>
  );
}
