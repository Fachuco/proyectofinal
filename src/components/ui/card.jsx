import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/90 shadow-[0_24px_70px_rgba(0,0,0,.5)]",
        "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-yellow-300 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex items-start justify-between gap-4 p-5 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("text-2xl font-bold tracking-tight text-zinc-50", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5", className)} {...props} />;
}
