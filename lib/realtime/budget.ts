// ONLY file allowed to call channel.send. Every Realtime send passes budgetGuard().
import type { SupabaseClient } from "@supabase/supabase-js";

const PER_CHANNEL_PER_SEC = 8;
const GLOBAL_PER_SEC = 60;
const MIN_GAP_MS = 250;

const chanStamps = new Map<string, number[]>();
const globalStamps: number[] = [];
const lastSend = new Map<string, number>();

export function budgetGuard(channel: string, now = Date.now()): boolean {
  const stamps = (chanStamps.get(channel) ?? []).filter((t) => now - t < 1000);
  while (globalStamps.length && now - globalStamps[0] > 1000) globalStamps.shift();
  const last = lastSend.get(channel) ?? 0;
  if (now - last < MIN_GAP_MS) return false;
  if (stamps.length >= PER_CHANNEL_PER_SEC) return false;
  if (globalStamps.length >= GLOBAL_PER_SEC) return false;
  stamps.push(now);
  chanStamps.set(channel, stamps);
  globalStamps.push(now);
  lastSend.set(channel, now);
  return true;
}

// Server-side broadcast via service-role client (small payloads ≤512B target).
export async function safeSend(
  supabase: SupabaseClient,
  channel: string,
  event: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  if (!budgetGuard(channel)) return false;
  const ch = supabase.channel(channel, { config: { broadcast: { ack: false } } });
  await ch.subscribe();
  const res = await ch.send({ type: "broadcast", event, payload });
  await supabase.removeChannel(ch);
  return res === "ok";
}

// Client-side sender factory. Components must use this — never channel.send directly.
export function makeClientSender(supabase: SupabaseClient, channelName: string) {
  let ch: ReturnType<SupabaseClient["channel"]> | null = null;
  return {
    async ensure() {
      if (!ch) {
        ch = supabase.channel(channelName, { config: { broadcast: { ack: false } } });
        await ch.subscribe();
      }
      return ch;
    },
    async send(event: string, payload: Record<string, unknown>) {
      if (!budgetGuard(channelName)) return false;
      const c = await this.ensure();
      const res = await c.send({ type: "broadcast", event, payload });
      return res === "ok";
    },
    async cleanup() {
      if (ch) { await supabase.removeChannel(ch); ch = null; }
    },
  };
}
