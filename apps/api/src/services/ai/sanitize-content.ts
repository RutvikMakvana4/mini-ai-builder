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
 * with no semicolon or newline separator. Force a break before any
 * import/export keyword that follows other content on the same line.
 */
export function normalizeStatementBreaks(content: string): string {
  return content.replace(
    /([^\n;])[ \t]+(import\s|export\s)/g,
    (_match, prevChar: string, keyword: string) => `${prevChar};\n${keyword}`,
  );
}

/**
 * Models occasionally close a JSX comment with a mismatched bracket, e.g.
 *   {/* Hero Section *\/)
 * instead of
 *   {/* Hero Section *\/}
 * This is a common, mechanically-fixable typo — repair it instead of
 * discarding an otherwise-complete file over one character.
 */
export function fixMismatchedJsxComments(content: string): string {
  return content.replace(
    /\{\/\*([\s\S]*?)\*\/\)/g,
    (_match, inner: string) => `{/*${inner}*/}`,
  );
}

export function sanitizeGeneratedContent(content: string): string {
  return fixKnownImportTypos(
    fixMismatchedJsxComments(
      normalizeStatementBreaks(stripCodeFences(content)),
    ),
  );
}

const KNOWN_IMPORT_TYPOS: Record<string, string> = {
  eact: "react",
  "eact-dom": "react-dom",
  ext: "next",
  "lucide-eact": "lucide-react",
};

export function fixKnownImportTypos(content: string): string {
  return content.replace(
    /from ['"]([a-zA-Z0-9@/_-]+)['"]/g,
    (match, spec: string) => {
      const fixed = KNOWN_IMPORT_TYPOS[spec];
      return fixed ? match.replace(spec, fixed) : match;
    },
  );
}
