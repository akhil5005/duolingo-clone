import { Dog, MessageCircle, Plane, Shirt, Star, Users, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Skills store an icon name, not a component. Mapping only the names actually
 * seeded keeps the whole icon library out of the bundle.
 */
const SKILL_ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  Utensils,
  Users,
  Plane,
  Shirt,
  Dog,
};

export function skillIcon(name: string): LucideIcon {
  return SKILL_ICONS[name] ?? Star;
}
