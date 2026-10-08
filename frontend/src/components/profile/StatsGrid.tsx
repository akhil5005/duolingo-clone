import { Card } from "@/components/ui/Card";
import type { Profile } from "@/lib/types";

interface StatProps {
  icon: string;
  value: string | number;
  label: string;
}

function Stat({ icon, value, label }: StatProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-base leading-tight sm:text-lg">{value}</p>
        <p className="truncate text-xs font-semibold text-muted">{label}</p>
      </div>
    </Card>
  );
}

export function StatsGrid({ stats }: { stats: Profile["stats"] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg">Statistics</h2>
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={"\u{1F525}"} value={stats.streak} label="Day streak" />
        <Stat icon="⚡" value={stats.total_xp} label="Total XP" />
        <Stat icon={"\u{1F6E1}"} value={stats.league} label="Current league" />
        <Stat icon={"\u{1F3C5}"} value={stats.top3_finishes} label="Top 3 finishes" />
      </div>
    </section>
  );
}
