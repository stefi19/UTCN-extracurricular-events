import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";

export function useUnifiedSession() {
  const nextAuth = useSession();
  const [utcnSession, setUtcnSession] = useState<Session | null>(null);
  const [loadingUtcSession, setLoadingUtcSession] = useState(false);

  useEffect(() => {
    if (nextAuth.status !== "unauthenticated") return;

    let cancelled = false;
    setLoadingUtcSession(true);
    fetch("/api/utcn/session", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => {
        if (!cancelled) setUtcnSession(session);
      })
      .catch(() => {
        if (!cancelled) setUtcnSession(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingUtcSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nextAuth.status]);

  return {
    ...nextAuth,
    data: nextAuth.data ?? utcnSession,
    status:
      nextAuth.status === "loading" || loadingUtcSession
        ? "loading"
        : nextAuth.data || utcnSession
          ? "authenticated"
          : "unauthenticated",
  } as const;
}
