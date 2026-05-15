import { SessionProvider } from "next-auth/react";
import { requireUser } from "@/server/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar isAdmin={user.role === "ADMIN"} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header user={{ name: user.name, email: user.email, role: user.role }} />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
