export default function MetricCard({ title, value, subtitle, icon, color = "brand" }) {
  const colors = {
    brand: "from-brand-500/20 to-brand-500/5 border-brand-500/20",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/20",
    red: "from-red-500/20 to-red-500/5 border-red-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20"
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}
