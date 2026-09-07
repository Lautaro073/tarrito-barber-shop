export const PUSH_SNOOZE_KEY = 'tarrito-push-snoozed-until';
export const PUSH_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldPromptPush(standalone: boolean, permission: string, snoozedUntil: string | null, now = Date.now()) {
  return standalone && permission === 'default' && !(Number(snoozedUntil) > now);
}
