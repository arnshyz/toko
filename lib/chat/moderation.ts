// lib/chat/moderation.ts
const BANNED = ["badword1", "badword2"];

export type ModerationResult = {
  cleanText: string;
  flagged: boolean;
  matchedTerms: string[];
};

export function moderate(input: string): ModerationResult {
  const content = input.trim();
  const lower = content.toLowerCase();
  const matched = BANNED.filter(w => lower.includes(w));
  return {
    cleanText: content,
    flagged: matched.length > 0,
    matchedTerms: matched,
  };
}


export function scanMessageContent(input: string): ModerationResult {
  return moderate(input);
}
