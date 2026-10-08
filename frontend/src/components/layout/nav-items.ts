import {
  BarChart3,
  Home,
  Scroll,
  Settings,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Items hidden from the compact bottom bar on phones. */
  desktopOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/learn", label: "Learn", icon: Home },
  { href: "/leaderboard", label: "Leaderboards", icon: BarChart3 },
  { href: "/quests", label: "Quests", icon: Scroll },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings, desktopOnly: true },
];
