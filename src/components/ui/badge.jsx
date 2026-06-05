import { cn } from "../../lib/utils";

const tones = {
  Alta: "bg-red-400/15 text-red-300",
  Vencido: "bg-red-400/15 text-red-300",
  Media: "bg-yellow-300/15 text-yellow-200",
  Proximo: "bg-yellow-300/15 text-yellow-200",
  "Revisar ahora": "bg-yellow-300/15 text-yellow-200",
  Baja: "bg-emerald-300/15 text-emerald-200",
  "Al dia": "bg-emerald-300/15 text-emerald-200",
  Opcional: "bg-zinc-800 text-zinc-300",
  Pendiente: "bg-zinc-800 text-zinc-300"
};

export function Badge({ className, tone, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex w-max items-center rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone || children] || "bg-zinc-800 text-zinc-300",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
