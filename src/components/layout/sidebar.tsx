"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Building2,
  Download,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  KeyRound,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/venues", label: "Canchas", icon: Building2 },
  { href: "/downloads", label: "Descargas", icon: Download },
  { href: "/costs", label: "Costos", icon: DollarSign },
  { href: "/roi", label: "ROI", icon: TrendingUp },
  { href: "/reports", label: "Reportes", icon: FileSpreadsheet },
];

const adminNav = [
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/api-keys", label: "API keys", icon: KeyRound },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          sier-kse
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2 px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </div>
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
