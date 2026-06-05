import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-yellow-300 text-zinc-950 shadow-[0_12px_34px_rgba(250,204,21,.2)] hover:bg-yellow-200",
        outline: "border border-zinc-800 bg-zinc-950 text-zinc-100 hover:border-yellow-300/50 hover:text-yellow-200",
        ghost: "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
