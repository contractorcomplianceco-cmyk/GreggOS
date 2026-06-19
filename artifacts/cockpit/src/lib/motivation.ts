export const MOTIVATION_MESSAGES: string[] = [
  "You are not managing tasks. You are protecting relationships and revenue stability.",
  "Every call you process is a client who feels heard. That is the work.",
  "Speed protects trust. The faster the follow-through, the stronger the relationship.",
  "You don't chase clients. You steward the ones who already chose us.",
  "Risk caught early is revenue saved. Stay one step ahead.",
  "Expansion is just retention with ambition. Deepen before you widen.",
  "The cockpit organizes the noise so you can lead with judgment.",
  "Protect the relationship and the revenue follows. Lead with the relationship.",
  "One clean follow-through today is worth ten promises tomorrow.",
  "Cold accounts don't announce themselves. Reach out before they cool.",
  "Your judgment is the product. The system just keeps the follow-through tight.",
  "Close the loop. An open commitment is an open risk.",
];

export type MotivationSlot = {
  key: string;
  index: number;
  greeting: string;
  hour: number;
};

export function currentMotivationSlot(date: Date = new Date()): MotivationSlot {
  const startOfYear = new Date(date.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86400000);
  const slot = Math.floor(date.getHours() / 3); // 0..7, eight slots through the day
  const index = ((dayOfYear * 8 + slot) % MOTIVATION_MESSAGES.length + MOTIVATION_MESSAGES.length) % MOTIVATION_MESSAGES.length;
  const hour = date.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Late shift";
  return { key: `${dayOfYear}-${slot}`, index, greeting, hour };
}

export function motivationMessageForSlot(slot: MotivationSlot): string {
  return MOTIVATION_MESSAGES[slot.index]!;
}
