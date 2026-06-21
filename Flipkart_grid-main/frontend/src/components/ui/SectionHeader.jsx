import { cx } from "../../lib/accents.js";

export default function SectionHeader({ title, sub, icon: Icon, accent = "violet", className = "" }) {
  const hex = {
    violet: "#7C6AF7",
    cyan: "#22D3EE",
    emerald: "#10B981",
    amber: "#F59E0B",
    rose: "#FB4D6D",
  }[accent];
  return (
    <div className={cx("mb-5", className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="rounded-chip p-1.5" style={{ background: `${hex}1a`, color: hex }}>
            <Icon size={18} />
          </span>
        )}
        <h2 className="font-display text-xl text-ink-primary">{title}</h2>
      </div>
      {sub && <p className="mt-1 max-w-2xl text-sm text-ink-body">{sub}</p>}
    </div>
  );
}
