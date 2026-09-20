"use client";
import { useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeClientSender } from "./budget";

export function useRoomChannel(
  supabase: SupabaseClient | null,
  roomId: string | null,
  handlers: Record<string, (payload: Record<string, unknown>) => void>,
  opts?: { trackPresence?: Record<string, unknown> }
) {
  const ref = useRef<ReturnType<typeof makeClientSender> | null>(null);
  const hRef = useRef(handlers);
  hRef.current = handlers;
  useEffect(() => {
    if (!supabase || !roomId) return;
    const name = `room:${roomId}`;
    const sender = makeClientSender(supabase, name);
    ref.current = sender;
    let ch: Awaited<ReturnType<typeof sender.ensure>> | null = null;
    let alive = true;
    (async () => {
      ch = await sender.ensure();
      if (!alive || !ch) return;
      for (const [event, fn] of Object.entries(hRef.current)) {
        ch.on("broadcast", { event }, ({ payload }) =>
          (fn as (p: Record<string, unknown>) => void)(payload as Record<string, unknown>)
        );
      }
      if (opts?.trackPresence) await ch.track(opts.trackPresence);
    })();
    // Re-attach when handlers change is handled via hRef indirection.
    return () => {
      alive = false;
      sender.cleanup();
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, roomId]);
  return ref;
}

export function useBattleChannel(
  supabase: SupabaseClient | null,
  battleId: string | null,
  onTurn: (payload: Record<string, unknown>) => void
) {
  const oRef = useRef(onTurn);
  oRef.current = onTurn;
  useEffect(() => {
    if (!supabase || !battleId) return;
    const name = `battle:${battleId}`;
    const sender = makeClientSender(supabase, name);
    let ch: Awaited<ReturnType<typeof sender.ensure>> | null = null;
    let alive = true;
    (async () => {
      ch = await sender.ensure();
      if (!alive || !ch) return;
      ch.on("broadcast", { event: "turn_resolved" }, ({ payload }) =>
        oRef.current(payload as Record<string, unknown>)
      );
    })();
    return () => {
      alive = false;
      sender.cleanup();
    };
  }, [supabase, battleId]);
}
