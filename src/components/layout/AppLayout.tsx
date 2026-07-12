import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  Receipt,
  BarChart3,
  ClipboardCheck,
  Moon,
  Sun,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, type Role } from "@/lib/store";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const ROLES: Role[] = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"];

type NavItem = { title: string; url: string; icon: typeof Truck; roles: Role[] };
const NAV: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ROLES },
  { title: "Vehicles", url: "/vehicles", icon: Truck, roles: ["Fleet Manager", "Financial Analyst"] },
  { title: "Drivers", url: "/drivers", icon: Users, roles: ["Fleet Manager", "Safety Officer"] },
  { title: "Trips", url: "/trips", icon: RouteIcon, roles: ["Fleet Manager", "Driver"] },
  { title: "Maintenance", url: "/maintenance", icon: Wrench, roles: ["Fleet Manager"] },
  { title: "Fuel Logs", url: "/fuel", icon: Fuel, roles: ["Fleet Manager", "Financial Analyst"] },
  { title: "Fuel Approvals", url: "/fuel-approvals", icon: ClipboardCheck, roles: ["Fleet Manager"] },
  { title: "Expenses", url: "/expenses", icon: Receipt, roles: ["Fleet Manager", "Financial Analyst"] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["Financial Analyst", "Fleet Manager"] },
  { title: "Driver Portal", url: "/driver-portal", icon: RouteIcon, roles: ["Driver"] },
];

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("transitops-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("transitops-theme", next ? "dark" : "light");
  };
  return { dark, toggle };
}

function AppSidebar() {
  const role = useStore((s) => s.currentRole);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const items = NAV.filter((i) => i.roles.includes(role));
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="group-data-[collapsible=icon]:hidden">
            <img
              src="/transitops-logo.png"
              alt="TransitOps"
              className="h-10 w-auto rounded-md bg-white p-1"
            />
          </div>
          <div className="hidden h-8 w-8 items-center justify-center rounded-md bg-white p-0.5 group-data-[collapsible=icon]:flex">
            <img
              src="/transitops-icon.png"
              alt="TransitOps"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = pathname === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={it.title}>
                      <Link to={it.url}>
                        <it.icon className="h-4 w-4" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const role = useStore((s) => s.currentRole);
  const setRole = useStore((s) => s.setRole);
  const resetSeed = useStore((s) => s.resetSeed);
  const { dark, toggle } = useDark();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Switch role</span>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  resetSeed();
                  toast.success("Seed data reset");
                }}
                aria-label="Reset seed data"
                title="Reset seed data"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm" variant="outline">Sign in</Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
