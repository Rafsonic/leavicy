"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  CalendarDays,
  Users,
  LogOut,
  ChevronsUpDown,
  Building2,
  Check,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Avatar, AvatarFallback } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Badge } from "./badge";
import { signOut, switchOrg } from "@repo/database/actions/auth";
import { ROLE_LABELS, type AppRole, canReview } from "@repo/database/types";
import type { NavItem, SidebarProps } from "./app-sidebar.types";
import { initials } from "./app-sidebar.utils";

const BRAND = process.env.NEXT_PUBLIC_APP_NAME ?? "Leavicy";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: () => true },
  { href: "/requests", label: "My requests", icon: ClipboardList, show: () => true },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, show: canReview },
  { href: "/calendar", label: "Team calendar", icon: CalendarDays, show: () => true },
  { href: "/team", label: "Team & settings", icon: Users, show: (r) => r === "admin" },
];

function NavLinks({
  role,
  pathname,
  onNavigate,
}: {
  role: AppRole;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.flatMap((item) => {
        if (!item.show(role)) return [];
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return [
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>,
        ];
      })}
    </nav>
  );
}

function OrgSwitcher({
  activeOrg,
  memberships,
}: Pick<SidebarProps, "activeOrg" | "memberships">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between gap-2 px-2"
          />
        }
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 className="size-4 shrink-0" />
          <span className="truncate">{activeOrg.name}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Companies</DropdownMenuLabel>
          {memberships.map((m) => (
            <DropdownMenuItem
              key={m.org_id}
              onClick={() => switchOrg(m.org_id)}
              className="justify-between"
            >
              <span className="truncate">{m.name}</span>
              {m.org_id === activeOrg.id && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ profile, role }: Pick<SidebarProps, "profile" | "role">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
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
          <span className="text-xs text-muted-foreground">
            {ROLE_LABELS[role]}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">
            {profile.email}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          <ShieldCheck className="size-4" />
          Privacy & data
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar(props: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-background p-4 md:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 text-lg font-semibold"
        >
          <CalendarCheck className="size-6 text-primary" />
          {BRAND}
        </Link>
        <OrgSwitcher
          activeOrg={props.activeOrg}
          memberships={props.memberships}
        />
        <div className="flex-1">
          <NavLinks role={props.role} pathname={pathname} />
        </div>
        <UserMenu profile={props.profile} role={props.role} />
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b bg-background p-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <CalendarCheck className="size-5 text-primary" />
          {BRAND}
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="max-w-[8rem] truncate">
            {props.activeOrg.name}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {NAV.flatMap((item) =>
                item.show(props.role)
                  ? [
                      <DropdownMenuItem
                        key={item.href}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </DropdownMenuItem>,
                    ]
                  : [],
              )}
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Switch company</DropdownMenuLabel>
                {props.memberships.map((m) => (
                  <DropdownMenuItem
                    key={m.org_id}
                    onClick={() => switchOrg(m.org_id)}
                    className="justify-between"
                  >
                    <span className="truncate">{m.name}</span>
                    {m.org_id === props.activeOrg.id && (
                      <Check className="size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/account" />}>
                <ShieldCheck className="size-4" />
                Privacy & data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
