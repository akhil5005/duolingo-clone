import type { ReactNode } from "react";

interface SettingsRowProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm">{title}</p>
        {description && <p className="text-xs font-semibold text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function ComingSoonRow({ title }: { title: string }) {
  return (
    <SettingsRow title={title}>
      <span className="shrink-0 rounded-full bg-raised px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
        Coming soon
      </span>
    </SettingsRow>
  );
}
