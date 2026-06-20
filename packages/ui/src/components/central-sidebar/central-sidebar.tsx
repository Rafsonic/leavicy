"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Avatar, AvatarFallback } from "../avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { signOut } from "@repo/database/actions/auth";
import type { CentralSidebarProps } from "./central-sidebar.types";
import { initials } from "./central-sidebar.utils";

const BRAND = process.env.NEXT_PUBLIC_APP_NAME ?? "Leavicy Central";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", icon: Building2 },
];

export function CentralSidebar({
  id,
  profile,
}: CentralSidebarProps): React.JSX.Element {
  const pathname = usePathname();

  const links = NAV.map((item) => {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className="size-4" />
        {item.label}
      </Link>
    );
  });

  return (
    <div data-component="CentralSidebar" data-cy={id}>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-background p-4 md:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 text-lg font-semibold"
        >
          <CalendarCheck className="size-6 text-primary" />
          {BRAND}
        </Link>
        <nav className="flex flex-1 flex-col gap-1">{links}</nav>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                id="central-user-menu-button"
                data-cy="central-user-menu-button"
                variant="ghost"
                className="h-auto w-full justify-start gap-2 px-2"
              />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback>
                {initials(profile.full_name, profile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start">
              <span className="truncate text-sm font-medium">
                {profile.full_name ?? profile.email}
              </span>
              <span className="text-xs text-muted-foreground">Super-admin</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {profile.email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b bg-background p-3 md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <CalendarCheck className="size-5 text-primary" />
          {BRAND}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                id="central-mobile-menu-button"
                data-cy="central-mobile-menu-button"
                variant="outline"
                size="icon"
              >
                <Menu className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            {NAV.map((item) => (
              <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                <item.icon className="size-4" />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </div>
  );
}
