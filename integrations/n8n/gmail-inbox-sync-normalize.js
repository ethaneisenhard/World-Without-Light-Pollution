const rawProject = String($env.AS_MESSAGES_PROJECT_ID || "").trim();
const PROJECT_ID = rawProject || null;

function parseFrom(raw) {
  if (raw == null) return { name: "Unknown", address: "unknown" };
  if (typeof raw === "object" && !Array.isArray(raw)) {
    if (Array.isArray(raw.value) && raw.value[0]) return parseFrom(raw.value[0]);
    if (typeof raw.text === "string" && raw.text.trim()) {
      const fromText = parseFrom(raw.text);
      if (fromText.address !== "unknown") return fromText;
    }
    const address = String(raw.address || raw.email || "").trim();
    let name = String(raw.name || raw.displayName || "").trim();
    if (!name || name === "[object Object]") name = "";
    if (address) return { name: name || address, address };
    if (name) return { name, address: name.includes("@") ? name : "unknown" };
  }
  const s = String(raw || "").trim();
  if (!s || s === "[object Object]") return { name: "Unknown", address: "unknown" };
  const m = s.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) {
    const name = m[1].replace(/^["']|["']$/g, "").trim() || m[2];
    return { name, address: m[2].trim() };
  }
  if (s.includes("@")) return { name: s, address: s };
  return { name: s, address: s };
}

function decodeB64Url(data) {
  if (!data || typeof data !== "string") return "";
  try {
    const pad = data.length % 4 === 0 ? "" : "=".repeat(4 - (data.length % 4));
    const b64 = data.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function headerMap(payload) {
  const headers = payload?.headers;
  if (!Array.isArray(headers)) return {};
  const out = {};
  for (const h of headers) {
    if (h && typeof h.name === "string") out[h.name.toLowerCase()] = String(h.value || "");
  }
  return out;
}

function walkParts(part, acc) {
  if (!part || typeof part !== "object") return;
  const mime = String(part.mimeType || "").toLowerCase();
  const data = part.body?.data;
  if (data && mime === "text/plain" && !acc.text) acc.text = decodeB64Url(data);
  if (data && mime === "text/html" && !acc.html) acc.html = decodeB64Url(data);
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) walkParts(child, acc);
  }
}

function extractBodies(full) {
  let text = String(
    full.text || full.textPlain || full.snippet || full.body || "",
  ).trim();
  let html = String(
    full.html || full.textAsHtml || full.textHtml || full.bodyHtml || "",
  ).trim();
  const payload = full.payload;
  if (payload && typeof payload === "object") {
    const acc = { text: "", html: "" };
    if (payload.body?.data) {
      const mime = String(payload.mimeType || "").toLowerCase();
      const decoded = decodeB64Url(payload.body.data);
      if (mime === "text/html") acc.html = decoded;
      else if (mime === "text/plain") acc.text = decoded;
    }
    walkParts(payload, acc);
    if (!text && acc.text) text = acc.text.trim();
    if (!html && acc.html) html = acc.html.trim();
  }
  return { text, html };
}

const full = $input.first().json;
const headers = headerMap(full.payload);
const from = parseFrom(full.From || full.from || headers.from);
const subject = String(
  full.Subject || full.subject || headers.subject || "",
).trim();
const { text: textBody, html: htmlBody } = extractBodies(full);
const bodyText = subject
  ? textBody
    ? `Subject: ${subject}\n\n${textBody}`
    : `Subject: ${subject}`
  : textBody || "(empty email)";
const threadId = String(full.threadId || full.id || "unknown");
const gmailId = String(full.id || "");
const labels = Array.isArray(full.labelIds) ? full.labelIds : [];
const unread = labels.includes("UNREAD");
const internalDate = Number(full.internalDate);
const createdAt =
  Number.isFinite(internalDate) && internalDate > 0 ? internalDate : Date.now();

const envelope = {
  conversationId: `email:thread:${threadId}`,
  channel: "email",
  direction: "in",
  from,
  body: {
    text: bodyText,
    ...(htmlBody ? { html: htmlBody } : {}),
  },
  status: unread ? "unread" : "read",
  hasAttachment: Boolean(
    full.hasAttachments ||
      (full.attachments && full.attachments.length) ||
      full.payload?.parts?.some((p) => p.filename),
  ),
  projectId: PROJECT_ID,
  createdAt,
  meta: { gmailMessageId: gmailId, gmailThreadId: threadId, subject },
};

return [{ json: { envelope, createdAt } }];
