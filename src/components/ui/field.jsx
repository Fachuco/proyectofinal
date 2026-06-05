import { cn } from "../../lib/utils";

export function Field({ label, children, className }) {
  return (
    <label className={cn("grid gap-2 text-sm font-semibold text-zinc-200", className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}
