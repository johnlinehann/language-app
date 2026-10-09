export const MAX_HEARTS = 5;
export const REFILL_MS = 30 * 60_000;

export interface HeartsState {
  count: number;
  /** When the oldest missing heart started refilling. */
  since: number;
}

export const FULL_HEARTS = (now: number): HeartsState => ({ count: MAX_HEARTS, since: now });

/** Hearts after passive refill (one every 30 minutes). */
export function currentHearts(h: HeartsState, now: number): HeartsState {
  if (h.count >= MAX_HEARTS) return { count: MAX_HEARTS, since: now };
  const gained = Math.floor((now - h.since) / REFILL_MS);
  if (gained <= 0) return h;
  const count = Math.min(MAX_HEARTS, h.count + gained);
  return { count, since: count >= MAX_HEARTS ? now : h.since + gained * REFILL_MS };
}

export function loseHeart(h: HeartsState, now: number): HeartsState {
  const cur = currentHearts(h, now);
  return { count: Math.max(0, cur.count - 1), since: cur.count >= MAX_HEARTS ? now : cur.since };
}
