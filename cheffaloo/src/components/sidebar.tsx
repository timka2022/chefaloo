"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Sparkles,
  BookOpen,
  ShoppingCart,
  Heart,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Meal Plan", href: "/", icon: CalendarDays },
  { label: "AI Recipes", href: "/generate", icon: Sparkles },
  { label: "Recipes", href: "/recipes", icon: BookOpen },
  { label: "Grocery List", href: "/grocery-list", icon: ShoppingCart },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Preferences", href: "/preferences", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 h-full bg-white border-r border-[#F0EDE8]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="w-8 h-8 rounded-lg bg-[#7C9082] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base leading-none">C</span>
          </div>
          <span className="font-semibold text-[#2D2D2D] text-base tracking-tight">
            Cheffaloo
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl py-2 px-3 text-sm transition-colors ${
                  active
                    ? "bg-[rgba(124,144,130,0.08)] text-[#7C9082] font-medium"
                    : "text-[#8A8A8A] hover:text-[#5A5A5A] hover:bg-[#F5F3EF]"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="px-4 py-4 border-t border-[#F0EDE8] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#7C9082] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">TS</span>
          </div>
          <span className="text-sm text-[#5A5A5A] font-medium">Tim &amp; Sarah</span>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0EDE8] flex">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors ${
                active
                  ? "text-[#7C9082] font-medium"
                  : "text-[#ADADAD]"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
