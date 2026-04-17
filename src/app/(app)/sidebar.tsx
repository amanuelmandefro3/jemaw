"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Clock, LogOut, User, Bell, Check, SplitSquareVertical } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEffect, useState, useTransition } from "react";

interface SidebarProps {
  user: { name: string; email: string };
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pending", label: "Pending", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
];

type Notification = {
  id: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getNotifications().then((data) => setNotifications(data as Notification[])).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) {
      markAsRead({ notificationId: n.id })
        .then(() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x)))
        .catch(() => {});
    }
    router.push(n.link);
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 bg-[#0F172A]">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
          <SplitSquareVertical className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-white text-base tracking-tight">Jemaw</span>
      </div>

      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-white/[0.08] text-white font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] font-normal"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {href === "/pending" && unreadCount > 0 && (
                <span className="ml-auto text-[10px] bg-indigo-500 text-white rounded-full px-1.5 py-0.5 leading-none font-medium">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Bottom section */}
      <div className="px-2 py-3 space-y-0.5">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors">
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto text-[10px] bg-indigo-500 text-white rounded-full px-1.5 py-0.5 leading-none font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn("cursor-pointer flex items-start gap-2 px-3 py-2.5", !n.read && "bg-indigo-50/60")}
                >
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                  <div className={cn("flex-1 min-w-0", n.read && "ml-3.5")}>
                    <p className="text-xs leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="text-[10px] bg-slate-700 text-slate-200 font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
