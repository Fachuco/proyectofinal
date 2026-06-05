import { cn } from "../../lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-yellow-300/80 focus:ring-2 focus:ring-yellow-300/20",
        className
      )}
      {...props}
    />
  );
}
