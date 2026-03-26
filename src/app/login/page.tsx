"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000; // 1 minute

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const attemptsRef = useRef(0);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Rate limiting check
    if (lockedUntil && Date.now() < lockedUntil) {
      const seconds = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many attempts. Try again in ${seconds}s.`);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION_MS);
        setError("Too many failed attempts. Locked for 1 minute.");
        attemptsRef.current = 0;
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      attemptsRef.current = 0;
      setLockedUntil(null);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-full max-w-sm p-8 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
        <h1 className="text-xl font-semibold text-[#e4e4ef] mb-6 text-center">
          EcomUp Canvas
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8888aa] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a4a] rounded text-sm text-[#e4e4ef] focus:outline-none focus:border-[#3b82f6]"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8888aa] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a4a] rounded text-sm text-[#e4e4ef] focus:outline-none focus:border-[#3b82f6]"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-[#ef4444]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#3b82f6] text-white rounded text-sm font-medium hover:bg-[#2563eb] disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
