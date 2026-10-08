"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePath } from "@/hooks/usePath";

export default function LearnPage() {
  const { data, isPending, isError } = usePath();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-muted">We could not load your path. Please try again.</p>;
  }

  return (
    <div className="space-y-8">
      {data.units.map((unit) => (
        <section key={unit.id} className="space-y-3">
          <div
            className="rounded-2xl px-5 py-4 text-white"
            style={{ backgroundColor: unit.color_hex }}
          >
            <p className="text-xs uppercase tracking-widest opacity-80">
              Unit {unit.order_index}
            </p>
            <h2 className="text-xl">{unit.title}</h2>
            <p className="text-sm font-semibold opacity-90">
              {unit.completed_skills}/{unit.total_skills} skills complete
            </p>
          </div>

          {unit.skills.map((skill) => (
            <Card key={skill.id} className="flex items-center justify-between px-4 py-3">
              <span>{skill.title}</span>
              <span className="text-sm text-muted">
                {skill.state} · {skill.lessons_completed}/{skill.total_lessons}
              </span>
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
}
