import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon: Icon, color = 'bg-primary-500', subtitle }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="text-white" size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
