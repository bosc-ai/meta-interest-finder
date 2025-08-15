"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("theme-dark");
    const d = saved ? saved === "1" : true;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    document.body.style.backgroundColor = d ? "#0a0a0a" : "#fafafa";
    document.body.style.color = d ? "#fafafa" : "#0a0a0a";
  }, []);
  function toggle() {
    const v = !dark;
    setDark(v);
    localStorage.setItem("theme-dark", v ? "1" : "0");
    document.documentElement.classList.toggle("dark", v);
    document.body.style.backgroundColor = v ? "#0a0a0a" : "#fafafa";
    document.body.style.color = v ? "#fafafa" : "#0a0a0a";
  }
  return (
    <button
      onClick={toggle}
      className="btn-ghost relative w-10 h-10 grid place-items-center"
      aria-label="Toggle theme"
    >
      <AnimatePresence initial={false} mode="wait">
        {dark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
          >
            <Moon size={18} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
          >
            <Sun size={18} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
