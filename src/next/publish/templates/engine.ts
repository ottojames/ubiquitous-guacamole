const CONDITIONAL_REGEX = /\{\{#if\s+([A-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
const TOKEN_REGEX = /\{\{([A-Z0-9_]+)\}\}/g;

function applyConditionals(template: string, tokens: Record<string, string>): string {
  return template.replace(CONDITIONAL_REGEX, (_match, key: string, block: string) => {
    const value = tokens[key]?.trim();
    if (value) {
      return applyConditionals(block, tokens);
    }
    return "";
  });
}

function replaceTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(TOKEN_REGEX, (_match, key: string) => {
    const raw = tokens[key];
    const value = typeof raw === "string" ? raw.trim() : "";
    return value.length ? value : `[[missing:${key}]]`;
  });
}

function cleanParagraphs(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .reduce<string[]>((acc, line) => {
      if (!line) {
        if (acc.length === 0 || acc[acc.length - 1] !== "") {
          acc.push("");
        }
      } else {
        acc.push(line);
      }
      return acc;
    }, [])
    .filter((line, index, arr) => !(line === "" && (index === 0 || index === arr.length - 1)))
    .join("\n");
}

export function renderNoticeTemplate(template: string, tokens: Record<string, string>): string {
  const withConditionals = applyConditionals(template, tokens);
  const withTokens = replaceTokens(withConditionals, tokens);
  const normalised = withTokens.replace(/\n{3,}/g, "\n\n");
  return cleanParagraphs(normalised).trim();
}

export function renderHtmlFromText(text: string): string {
  const paragraphs = text.split(/\n{2,}/).map((para) => para.trim()).filter(Boolean);
  if (!paragraphs.length) {
    return "<p></p>";
  }
  return paragraphs.map((para) => `<p>${para.replace(/\n/g, "<br />")}</p>`).join("\n");
}
