import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Sparkles,
  Receipt as ReceiptIcon,
  Calculator,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useStaff } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import logo from "@/assets/laser-grafix-logo-transparent.png";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

type AdminPath =
  | "/admin"
  | "/admin/sales"
  | "/admin/customers"
  | "/admin/services"
  | "/admin/expenses"
  | "/admin/day-end"
  | "/admin/settings";

type NavItem = {
  to: AdminPath;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

// Clean workflow navigation (New Sale is exclusively the dedicated Button-in-Button CTA)
const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/sales", label: "Sales History", icon: FileText },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/services", label: "Services", icon: Sparkles },
  { to: "/admin/expenses", label: "Expenses", icon: ReceiptIcon },
  { to: "/admin/day-end", label: "Day End", icon: Calculator },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function AdminLayout() {
  const navigate = useNavigate();
  const { email, profile, isAdmin } = useStaff();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const displayName = profile?.full_name || email?.split("@")[0] || "Staff";
  const userInitial = (profile?.full_name || email || "S").charAt(0).toUpperCase();

  // Global F2 = New Sale
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        navigate({ to: "/admin/new-sale" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const title =
    pathname === "/admin/new-sale"
      ? "New Sale"
      : (NAV.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? "Dashboard");

  return (
    <div className="min-h-screen bg-pos-bg text-pos-text flex flex-col antialiased">
      {/* High-End Floating Island Topbar */}
      <header className="sticky top-0 z-40 w-full pt-3 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 max-w-[1536px] items-center justify-between gap-4 px-4 sm:px-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-border/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-300">
          
          {/* Brand Enclosure (Double-Bezel) */}
          <div className="flex items-center gap-6 xl:gap-8 min-w-0">
            <Link
              to="/admin"
              className="flex shrink-0 items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              aria-label="Laser Grafix Admin Home"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-card to-muted border border-border/70 shadow-2xs transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logo}
                  alt="Laser Grafix logo"
                  width={28}
                  height={28}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Laser Grafix
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-lotus-aqua/70 text-lotus-charcoal border border-lotus-bluegray/30">
                    POS
                  </span>
                </div>
                <span className="hidden sm:inline-block text-[10px] text-muted-foreground font-medium">
                  Clinic Management
                </span>
              </div>
            </Link>

            {/* Machined Segmented Navigation Tray */}
            <nav
              aria-label="Main Navigation"
              className="hidden lg:flex items-center p-1 rounded-xl bg-muted/40 border border-border/50 shadow-inner"
            >
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active
                        ? "bg-card text-foreground shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        active ? "text-primary stroke-[2.2]" : "stroke-[1.8]",
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Button-in-Button CTA & Profile Capsule */}
          <div className="flex shrink-0 items-center gap-3">
            {/* Button-in-Button Primary CTA */}
            <Button
              asChild
              size="default"
              className={cn(
                "group relative hidden sm:inline-flex items-center gap-2.5 h-10 pl-4 pr-1.5 py-1.5 rounded-full bg-primary font-semibold text-xs tracking-tight text-primary-foreground shadow-[0_4px_16px_-2px_rgba(224,36,106,0.35)] hover:shadow-[0_8px_24px_0_rgba(224,36,106,0.45)] hover:bg-primary-hover active:scale-[0.98] transition-all duration-300 cursor-pointer",
                pathname === "/admin/new-sale" && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              title="Create a new sale (Shortcut: F2)"
              aria-keyshortcuts="F2"
            >
              <Link to="/admin/new-sale">
                <Plus
                  className="h-4 w-4 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90"
                  aria-hidden="true"
                />
                <span>New Sale</span>
                <span className="flex h-7 px-2.5 items-center justify-center rounded-full bg-white/20 font-mono text-[10px] font-bold tracking-wider text-white shadow-inner transition-transform duration-200 group-hover:scale-105">
                  F2
                </span>
              </Link>
            </Button>

            {/* Profile Capsule with Live Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-full bg-card hover:bg-muted/60 border border-border/70 shadow-2xs backdrop-blur-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer group"
                  aria-label={`User account menu for ${displayName}`}
                >
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-lotus-lilac/70 text-xs font-bold text-primary ring-1 ring-primary/25 transition-transform duration-200 group-hover:scale-105"
                    >
                      {userInitial}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[120px] truncate text-xs font-semibold leading-tight text-foreground">
                      {displayName}
                    </p>
                    <p className="text-[10px] font-medium leading-tight text-muted-foreground capitalize">
                      {isAdmin ? "Admin" : "Staff"}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border/70 bg-card/95 backdrop-blur-xl shadow-xl p-1.5">
                <DropdownMenuLabel className="font-normal px-2.5 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {profile?.full_name || displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                    <div className="pt-1">
                      <span className="inline-block rounded-md bg-lotus-aqua/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lotus-charcoal">
                        {isAdmin ? "Administrator" : "Clinic Staff"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/admin" className="flex items-center text-xs font-medium py-2">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/admin/day-end" className="flex items-center text-xs font-medium py-2">
                    <Calculator className="mr-2 h-4 w-4 text-muted-foreground" /> Day End Closing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/admin/settings" className="flex items-center text-xs font-medium py-2">
                    <SettingsIcon className="mr-2 h-4 w-4 text-muted-foreground" /> System Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem
                  className="rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer text-xs font-medium py-2"
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/admin/login", replace: true });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile / Tablet Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground hover:bg-muted/70 rounded-xl"
              aria-label="Toggle navigation menu"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile / Tablet Floating Drawer */}
        {open && (
          <nav
            aria-label="Mobile Navigation"
            className="mt-2.5 mx-auto max-w-[1536px] rounded-2xl border border-border/70 bg-card/95 backdrop-blur-xl p-4 lg:hidden shadow-xl animate-in fade-in slide-in-from-top-3 duration-200"
          >
            {/* Prominent New Sale CTA on mobile */}
            <div className="mb-3">
              <Button
                asChild
                className="w-full h-11 bg-primary font-semibold text-primary-foreground hover:bg-primary-hover shadow-md rounded-xl justify-between px-4"
                onClick={() => setOpen(false)}
              >
                <Link to="/admin/new-sale">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    New Sale
                  </span>
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-mono font-bold">
                    F2
                  </span>
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold tracking-tight transition-colors",
                      active
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-2xs"
                        : "text-foreground/80 hover:bg-muted/70 hover:text-foreground border border-transparent",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-lotus-lilac/80 text-xs font-bold text-primary"
                >
                  {userInitial}
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-foreground truncate max-w-[150px]">
                    {displayName}
                  </p>
                  <p className="text-muted-foreground capitalize text-[10px]">{isAdmin ? "Admin" : "Staff"}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-lg text-xs"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/admin/login", replace: true });
                }}
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Log out
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1536px] flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Laser Grafix Clinic &amp; POS Management
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="rounded-full bg-lotus-aqua/40 px-3 py-1 text-xs font-medium text-lotus-charcoal inline-flex items-center gap-1.5 border border-lotus-bluegray/30">
              <kbd className="font-mono text-[10px] font-bold uppercase bg-card px-1.5 py-0.5 rounded shadow-2xs">F2</kbd> Quick New Sale
            </span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
