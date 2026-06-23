import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Lock, User, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Glassmorphic login dialog. On success it closes and (optionally) routes to
 * the dashboard. Demo credentials are shown as quick-fill chips.
 */
export default function LoginModal({ open, onClose, redirectTo = "/dashboard" }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      onClose?.();
      if (redirectTo) navigate(redirectTo);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center p-5"
          style={{ background: "rgba(8,12,20,0.7)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass relative w-full max-w-md rounded-card p-7"
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-ink-faint transition-colors hover:text-ink-primary">
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-inner bg-gradient-to-br from-violet to-cyan text-white shadow-glow-violet">
                <ShieldCheck size={22} />
              </span>
              <div>
                <h2 className="font-display text-xl text-ink-primary">Command Center Login</h2>
                <p className="text-xs text-ink-faint">Bengaluru Traffic Police · Secure access</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Field icon={User} label="Username" value={username} onChange={setUsername} placeholder="admin" autoFocus />
              <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

              {error && (
                <div className="rounded-inner px-3 py-2 text-sm" style={{ background: "rgba(251,77,109,0.12)", border: "1px solid rgba(251,77,109,0.35)", color: "#FB4D6D" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="flex w-full items-center justify-center gap-2 rounded-inner bg-gradient-to-r from-violet to-[#6366F1] py-3 font-semibold text-white shadow-glow-violet transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Authenticating…" : "Sign in"}
              </button>
            </form>

            <div className="mt-5 border-t border-subtle pt-4">
              <p className="label-caps mb-2">Demo credentials</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => quickFill("admin", "btp123")} className="rounded-chip border border-subtle px-3 py-1.5 text-xs text-ink-body transition-colors hover:border-violet/40 hover:text-violet">
                  admin / btp123 <span className="text-violet">· full access</span>
                </button>
                <button onClick={() => quickFill("user", "user123")} className="rounded-chip border border-subtle px-3 py-1.5 text-xs text-ink-body transition-colors hover:border-cyan/40 hover:text-cyan">
                  user / user123 <span className="text-cyan">· limited</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", placeholder, autoFocus }) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block">{label}</span>
      <div className="relative">
        <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type={type}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-inner border border-subtle bg-card/60 py-2.5 pl-9 pr-3 text-sm text-ink-primary outline-none transition-all placeholder:text-ink-faint focus:border-violet focus:ring-2 focus:ring-violet/30"
        />
      </div>
    </label>
  );
}
