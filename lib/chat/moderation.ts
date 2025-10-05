const BANNED_TERMS = [
  "bannedword",
  "scam",
  "fraud",
  "hack",
];

export function scanMessageContent(content: string): {
  cleanText: string;
  flagged: boolean;
  matchedTerms: string[];
} {
  const lower = content.toLowerCase();
  const matched: string[] = [];
  for (const term of BANNED_TERMS) {
    if (lower.includes(term)) {
      matched.push(term);
    }
  }
  return {
    cleanText: content,
    flagged: matched.length > 0,
    matchedTerms: matched,
  };
}
