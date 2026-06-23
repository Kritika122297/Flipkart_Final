import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import LoginModal from "../auth/LoginModal.jsx";

export default function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-x-0 top-0 z-[2000] transition-all duration-300 ${
        scrolled ? "glass border-b border-subtle" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-inner bg-gradient-to-br from-violet to-cyan font-display text-sm text-white shadow-glow-violet">
            P
          </div>
          <span className="font-display text-lg text-ink-primary">
            SmartPark<span className="text-violet"> AI</span>
          </span>
        </div>
        <nav className="hidden items-center gap-7 text-sm text-ink-body md:flex">
          <a href="#features" className="transition-colors hover:text-ink-primary">Capabilities</a>
          <a href="#impact" className="transition-colors hover:text-ink-primary">Impact</a>
          <a href="#preview" className="transition-colors hover:text-ink-primary">Preview</a>
        </nav>
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-inner border border-subtle px-3 py-1.5 sm:flex">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-[0.6rem] font-bold uppercase text-white">
                  {user.username.slice(0, 2)}
                </span>
                <span className="text-xs text-ink-body">
                  {user.name} · <span className="font-semibold capitalize text-violet">{user.role}</span>
                </span>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-inner bg-gradient-to-r from-violet to-[#6366F1] px-4 py-2 text-sm font-semibold text-white shadow-glow-violet"
              >
                Open Dashboard
              </button>
              <button
                onClick={logout}
                title="Log out"
                className="grid h-9 w-9 place-items-center rounded-inner border border-subtle text-ink-body transition-colors hover:border-rose/50 hover:text-rose"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-2 rounded-inner border border-strong px-4 py-2 text-sm font-semibold text-ink-primary transition-colors hover:border-violet/50 hover:text-violet"
            >
              <LogIn size={15} /> Sign in
            </button>
          )}
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  );
}
