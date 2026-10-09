"use client";

import Link from "next/link";

import { Button3D } from "@/components/ui/Button3D";
import { Skeleton } from "@/components/ui/Skeleton";
import { SpeakerButton } from "@/components/lesson/SpeakerButton";
import { useGuidebook } from "@/hooks/useGuidebook";

/**
 * What each unit teaches, in one place.
 *
 * The words come from the same `Skill.vocabulary` the lesson player presents
 * before a skill's first lesson, so the guidebook can never promise a phrase
 * the lessons never cover.
 */
export default function GuidebookPage() {
  const { data: guidebook, isPending } = useGuidebook();

  if (isPending || !guidebook) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl">Guidebook</h1>
        <p className="mt-1 text-sm font-semibold text-muted">
          Key phrases and grammar for {guidebook.course_title}. Tap any word to hear it.
        </p>
      </header>

      <div className="space-y-6">
        {guidebook.units.map((unit) => (
          <section
            key={unit.id}
            className="overflow-hidden rounded-2xl border-2 border-line bg-surface"
          >
            <div className="px-5 py-4" style={{ backgroundColor: unit.color_hex }}>
              <p className="text-xs uppercase tracking-widest text-white/80">
                Unit {unit.order_index}
              </p>
              <h2 className="text-xl text-white">{unit.title}</h2>
              <p className="text-sm font-semibold text-white/90">{unit.description}</p>
            </div>

            {unit.grammar_note && (
              <div className="border-b-2 border-line px-5 py-4">
                <p className="mb-1 text-xs uppercase tracking-widest text-muted">
                  Grammar
                </p>
                <p className="text-sm leading-relaxed">{unit.grammar_note}</p>
              </div>
            )}

            <div className="divide-y-2 divide-line">
              {unit.skills.map((skill) => (
                <div key={skill.id} className="px-5 py-4">
                  <p className="mb-3 text-xs uppercase tracking-widest text-muted">
                    {skill.title}
                  </p>
                  <ul className="space-y-2">
                    {skill.vocabulary.map((word) => (
                      <li
                        key={word.term}
                        className="flex items-center gap-3 rounded-xl border-2 border-line px-3 py-2"
                      >
                        <span aria-hidden className="w-8 shrink-0 text-center text-2xl">
                          {word.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            lang={guidebook.language_code}
                            className="block truncate text-base"
                          >
                            {word.term}
                          </span>
                          <span className="block text-xs font-semibold text-muted">
                            {word.translation}
                          </span>
                        </span>
                        <SpeakerButton text={word.term} lang={guidebook.language_code} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/learn">
          <Button3D variant="primary" size="lg" fullWidth>
            Back to learning
          </Button3D>
        </Link>
      </div>
    </div>
  );
}
