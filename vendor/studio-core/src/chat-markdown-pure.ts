/**
 * Chat-safe markdown → HTML (GFM tables, lists, etc.).
 * Escapes raw HTML tokens so assistant content cannot XSS the Studio shell.
 * Linkifies project-relative file paths in codespans / relative file links.
 */
import { marked, type Tokens } from "marked";
import {
  chatFileLinkHtml,
  parseChatFilePath,
} from "./chat-file-path-pure.js";
import { prepareChatMarkdownSource } from "./chat-markdown-prepare-pure.js";

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Render assistant/error chat markdown to HTML (sync). */
export function chatMarkdownToHtml(source: string): string {
  const text = prepareChatMarkdownSource(source.replace(/^\uFEFF/, ""));
  if (!text.trim()) return "";

  const renderer = new marked.Renderer();
  renderer.html = (token: Tokens.HTML | Tokens.Tag) => {
    const raw =
      typeof token === "object" && token && "raw" in token
        ? String((token as Tokens.HTML).raw ?? "")
        : String(token ?? "");
    return escapeHtml(raw);
  };
  // Scroll shell so wide comparison tables don't crush columns in the bubble.
  const baseTable = renderer.table.bind(renderer);
  renderer.table = (token: Tokens.Table) =>
    `<div class="as-chat-md-table" data-studio-chat-md-table>${baseTable(token)}</div>`;

  const baseCodespan = renderer.codespan.bind(renderer);
  renderer.codespan = (token: Tokens.Codespan) => {
    const raw =
      typeof token === "object" && token && "text" in token
        ? String(token.text ?? "")
        : String(token ?? "");
    const path = parseChatFilePath(raw);
    if (path) return chatFileLinkHtml({ path, wrapCode: true });
    return baseCodespan(token);
  };

  const baseLink = renderer.link.bind(renderer);
  renderer.link = (token: Tokens.Link) => {
    const href = typeof token.href === "string" ? token.href : "";
    const labelText =
      typeof token.text === "string" ? token.text.trim() : "";
    // Href or label may be the path (models often smash soft-wraps into either side).
    const path =
      parseChatFilePath(href) ??
      (labelText ? parseChatFilePath(labelText) : null);
    if (path && !/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      return chatFileLinkHtml({ path, wrapCode: true });
    }
    const html = baseLink(token);
    // http(s) → new browser tab (PWA / phone: don't replace the Chat shell).
    if (/^https?:\/\//i.test(href) || href.startsWith("//")) {
      if (/\starget=/.test(html)) return html;
      return html.replace(
        /^<a\s/i,
        '<a target="_blank" rel="noopener noreferrer" ',
      );
    }
    return html;
  };

  return marked.parse(text, {
    async: false,
    gfm: true,
    breaks: true,
    renderer,
  }) as string;
}
