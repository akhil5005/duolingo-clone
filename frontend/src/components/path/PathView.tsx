"use client";

import clsx from "clsx";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Mascot, type MascotExpression } from "@/components/mascot/Mascot";
import { ChestNode } from "@/components/path/ChestNode";
import { NodePopover } from "@/components/path/NodePopover";
import { SkillNode } from "@/components/path/SkillNode";
import { UnitBanner } from "@/components/path/UnitBanner";
import type { LearningPath, PathSkill, PathUnit } from "@/lib/types";

/** Amplitude of the snaking path, in pixels either side of centre. */
const ZIGZAG_AMPLITUDE = 70;
const ZIGZAG_STEP = 0.9;
const MASCOT_EXPRESSIONS: MascotExpression[] = ["happy", "thinking", "celebrating"];

interface PositionedSkill {
  skill: PathSkill;
  index: number;
}

function StartBubble() {
  return (
    // The bounce animates `transform`, so centring has to happen on a wrapper.
    <div className="pointer-events-none absolute -top-[52px] left-1/2 -translate-x-1/2">
      <div className="relative animate-bubble-bounce rounded-2xl border-2 border-line bg-surface px-4 py-2 text-xs uppercase tracking-wider text-brand">
        Start
        <span className="absolute -bottom-[7px] left-1/2 -ml-[6px] h-3 w-3 rotate-45 border-b-2 border-r-2 border-line bg-surface" />
      </div>
    </div>
  );
}

function PathRow({
  offset,
  mascot,
  children,
}: {
  offset: number;
  mascot: { side: "left" | "right"; expression: MascotExpression } | null;
  children: ReactNode;
}) {
  return (
    <div className="relative flex w-full justify-center">
      {mascot && (
        <div
          className={clsx(
            "absolute top-0 hidden sm:block",
            mascot.side === "left" ? "left-0" : "right-0",
          )}
        >
          <Mascot expression={mascot.expression} size={72} />
        </div>
      )}
      {/* Offset with `left`, not `transform`: a transformed ancestor would
          become the containing block for the popover's fixed backdrop and
          shrink it to the size of the node. */}
      <div className="relative" style={{ left: offset }}>
        {children}
      </div>
    </div>
  );
}

export function PathView({ path }: { path: LearningPath }) {
  const [openSkillId, setOpenSkillId] = useState<number | null>(null);
  const currentNodeRef = useRef<HTMLButtonElement | null>(null);
  const hasScrolled = useRef(false);

  // Numbering runs across the whole path so the zig-zag and the chests keep
  // their rhythm when a unit boundary goes by.
  const units = useMemo(() => {
    let cursor = 0;
    return path.units.map((unit) => ({
      unit,
      skills: unit.skills.map<PositionedSkill>((skill) => ({ skill, index: cursor++ })),
    }));
  }, [path]);

  const currentSkillId = useMemo(() => {
    const all = units.flatMap(({ skills }) => skills);
    return (
      all.find(({ skill }) => skill.state === "available" || skill.state === "in_progress")
        ?.skill.id ?? null
    );
  }, [units]);

  useEffect(() => {
    const node = currentNodeRef.current;
    if (hasScrolled.current || !node) return;
    hasScrolled.current = true;
    // Only chase the node if it is actually off screen. On a fresh course it is
    // already near the top, and centring it would tuck it under the sticky
    // unit banner.
    if (node.getBoundingClientRect().bottom > window.innerHeight * 0.75) {
      node.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [currentSkillId]);

  return (
    <div className="space-y-10">
      {units.map(({ unit, skills }) => (
        <section key={unit.id} aria-label={unit.title}>
          <UnitBanner unit={unit} />
          <div className="flex flex-col items-center gap-14">
            {skills.map(({ skill, index }) => (
              <Fragment key={skill.id}>
                <PathRow
                  offset={Math.sin(index * ZIGZAG_STEP) * ZIGZAG_AMPLITUDE}
                  mascot={mascotFor(index)}
                >
                  <div className="relative">
                    {skill.id === currentSkillId && openSkillId !== skill.id && <StartBubble />}
                    <SkillNode
                      ref={skill.id === currentSkillId ? currentNodeRef : undefined}
                      skill={skill}
                      unitColor={unit.color_hex}
                      isCurrent={skill.id === currentSkillId}
                      open={openSkillId === skill.id}
                      onToggle={() =>
                        setOpenSkillId((current) => (current === skill.id ? null : skill.id))
                      }
                    />
                    <NodePopover
                      skill={skill}
                      unitColor={unit.color_hex}
                      open={openSkillId === skill.id}
                      onClose={() => setOpenSkillId(null)}
                    />
                  </div>
                </PathRow>

                {index % 2 === 1 && <ChestNode />}
              </Fragment>
            ))}
          </div>
        </section>
      ))}

      <UnitFooter units={path.units} />
    </div>
  );
}

function mascotFor(index: number): { side: "left" | "right"; expression: MascotExpression } | null {
  if (index % 3 !== 2) return null;
  const slot = Math.floor(index / 3);
  return {
    side: slot % 2 === 0 ? "left" : "right",
    expression: MASCOT_EXPRESSIONS[slot % MASCOT_EXPRESSIONS.length] ?? "happy",
  };
}

function UnitFooter({ units }: { units: PathUnit[] }) {
  const done = units.every((unit) => unit.completed_skills === unit.total_skills);

  return (
    <div className="flex flex-col items-center gap-3 pb-8 text-center">
      <Mascot expression={done ? "celebrating" : "sleeping"} size={88} />
      <p className="max-w-xs text-sm font-semibold text-muted">
        {done
          ? "You finished every skill here. More units are on the way!"
          : "More units unlock as you work your way down the path."}
      </p>
    </div>
  );
}
