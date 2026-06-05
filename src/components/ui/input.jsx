import { cn } from "../../lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-yellow-300/80 focus:ring-2 focus:ring-yellow-300/20",
        className
      )}
      {...props}
    />
  );
}
