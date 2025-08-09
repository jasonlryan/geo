import { cn } from "@/lib/cn";

export function KPICard({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card", className)}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-slate-600">{label}</div>
    </div>
  );
}

export default KPICard;


