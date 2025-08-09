import { cn } from "@/lib/cn";

export function Badge({ className, children, variant = "neutral" }: { className?: string; children: React.ReactNode; variant?: "neutral" | "primary" | "success" | "warn" | "danger" }) {
  const variants: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-800 border border-slate-200",
    primary: "bg-blue-50 text-blue-800 border border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    warn: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-red-50 text-red-800 border border-red-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs rounded", variants[variant], className)}>
      {children}
    </span>
  );
}

export default Badge;


