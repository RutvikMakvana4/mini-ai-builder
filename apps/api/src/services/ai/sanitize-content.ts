/**
 * Models sometimes wrap file content in markdown code fences even when
 * asked for raw structured output. Strip them defensively.
 */
export function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Weaker models sometimes emit multiple statements on a single physical line
 * with no semicolon or newline separator, e.g.:
 *   import Hero from '@/components/Hero' import Features from '@/components/Features'
 * This is invalid JS/TS — ASI won't insert a semicolon mid-line. As a safety net,
 * force a break before any `import `/`export ` keyword that follows other content
 * on the same line without a preceding `;` or newline.
 */
export function normalizeStatementBreaks(content: string): string {
  return content.replace(
    /([^\n;])[ \t]+(import\s|export\s)/g,
    (_match, prevChar: string, keyword: string) => `${prevChar};\n${keyword}`,
  );
}

export function sanitizeGeneratedContent(content: string): string {
  return normalizeStatementBreaks(stripCodeFences(content));
}
