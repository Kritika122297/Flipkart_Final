import { accentClass, cx } from "../../lib/accents.js";

export default function Badge({ children, accent = "violet", pulse = false, className = "" }) {
  const a = accentClass[accent];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider",
        a.text,
        className
      )}
      style={{ background: `${a.hex}1a`, border: `1px solid ${a.hex}33` }}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: a.hex }}
          />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: a.hex }} />
        </span>
      )}
      {children}
    </span>
  );
}
