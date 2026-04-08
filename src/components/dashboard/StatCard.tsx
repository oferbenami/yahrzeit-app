interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "primary" | "green" | "orange" | "purple";
}

const colors = {
  primary: "bg-primary/10 text-primary border-primary/20",
  green: "bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
  orange: "bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  purple: "bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800",
};

export function StatCard({ title, value, subtitle, icon, color = "primary" }: StatCardProps) {
  return (
    <div className={`bg-card border rounded-xl p-5 flex items-start gap-4 ${colors[color]}`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-current/10" aria-hidden="true">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground leading-none mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
