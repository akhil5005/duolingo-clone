import { Mascot } from "@/components/mascot/Mascot";

export default function LessonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Mascot expression="thinking" size={132} />
      <h1 className="text-2xl">Getting your lesson ready…</h1>
      <p className="max-w-sm text-sm font-semibold text-muted">
        The lesson player is wired up in the next pass.
      </p>
    </div>
  );
}
