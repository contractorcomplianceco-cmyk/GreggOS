// Shared deterministic decision-boundary guard for AI-generated text.
//
// AI output is screened for language that would imply approving/committing to a
// pricing, refund, legal, compliance, or qualifier/placement decision — things
// this app must NEVER do. A trip forces the safe deterministic template
// fallback, so the guarantee does not rely on the model honoring its prompt.
const PROHIBITED_PATTERNS: RegExp[] = [
  /\b(approv\w+|grant\w+|issu\w+|process\w+|authoriz\w+|guarant\w+)\b[^.?!\n]{0,40}\brefund/i,
  /\brefund\b[^.?!\n]{0,40}\b(approv\w+|grant\w+|issu\w+|guarant\w+|authoriz\w+)/i,
  /\b(approv\w+|guarant\w+|lock\w*|waiv\w+|authoriz\w+)\b[^.?!\n]{0,40}\b(price|pricing|discount|rate|fee|cost)/i,
  /\b(price|pricing|discount|rate|fee|cost)\b[^.?!\n]{0,40}\b(approved|guaranteed|waived|locked in|authorized)/i,
  /\b(legal\w*|complian\w+)\b[^.?!\n]{0,40}\b(guarant\w+|assur\w+|approv\w+|certif\w+|no risk|in the clear)/i,
  /\b(qualifier|placement)\b[^.?!\n]{0,40}\b(approv\w+|guarant\w+|confirm\w+|secur\w+)/i,
  /\b(approv\w+|guarant\w+|confirm\w+|secur\w+)\b[^.?!\n]{0,40}\b(qualifier|placement)/i,
];

export function violatesBoundary(text: string): boolean {
  return PROHIBITED_PATTERNS.some((re) => re.test(text));
}

// True when the OpenAI integration is configured. Both the base URL and key
// must be present for any live AI call to be attempted.
export function aiConfigured(): boolean {
  return Boolean(
    process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] &&
      process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
  );
}
