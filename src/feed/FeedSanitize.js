// Minimal, deterministic sanitization for rich text HTML.
// Not a full HTML sanitizer (JS bundle) but prevents obvious script injection.

const MAX_LEN = 20_000;

function stripDangerousTags(html) {
  return html
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, "")
    .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, "");
}

function stripDangerousAttrs(html) {
  // Remove inline event handlers and javascript: URLs.
  return html
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\shref\s*=\s*"\s*javascript:[^"]*"/gi, ' href="#"')
    .replace(/\shref\s*=\s*'\s*javascript:[^']*'/gi, " href='#'");
}

export function sanitizeRichTextHtml(input) {
  if (typeof input !== "string") return "";
  const trimmed = input.slice(0, MAX_LEN);
  const noTags = stripDangerousTags(trimmed);
  const noAttrs = stripDangerousAttrs(noTags);
  return noAttrs;
}

export function plainTextForSearch(htmlOrText) {
  if (typeof htmlOrText !== "string") return "";
  return htmlOrText
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
