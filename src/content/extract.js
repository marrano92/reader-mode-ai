// Article extraction: Mozilla Readability with a heuristic fallback.
// Returns { title, byline, date, content } (content is an HTML string) or null
// when the page has no article.
import { Readability, isProbablyReaderable as readabilityIsProbablyReaderable } from "@mozilla/readability";

// Keep every video/embed provider: media must survive extraction (decision D3).
const READABILITY_OPTIONS = { allowedVideoRegex: /.*/i };

// Paragraph threshold below which a page is a listing/shell, not an article.
const MIN_PARAGRAPHS = 2;

// A paragraph shorter than this is a price, a blurb or a caption: not prose.
const MIN_PARAGRAPH_CHARS = 120;

// Noise removed by the heuristic fallback; media (img/video/iframe/...) is kept.
const NOISE_SELECTOR = [
  "script", "style", "noscript", "nav", "aside", "footer", "form", "button",
  "input", "select", "textarea", "[role='navigation']", "[role='banner']",
  "[role='contentinfo']", "[aria-hidden='true']", ".ad", ".ads", ".advertisement",
  ".ad-banner", ".banner", ".cookie", ".consent", ".newsletter", ".share",
  ".social", ".sidebar", ".related", ".recommendation", ".comments", "#comments",
  ".comment", ".popup",
].join(", ");

export function isProbablyReaderable(doc) {
  return readabilityIsProbablyReaderable(doc);
}

export function extractArticle(doc) {
  return parseWithReadability(doc) ?? fallbackExtract(doc);
}

function parseWithReadability(doc) {
  try {
    const parsed = new Readability(doc.cloneNode(true), READABILITY_OPTIONS).parse();
    if (!parsed || !parsed.content) return null;
    const content = String(parsed.content);
    if (!hasEnoughProse(content)) return null;
    return normalize({ title: parsed.title, byline: parsed.byline, date: parsed.publishedTime, content }, doc);
  } catch {
    return null;
  }
}

export function fallbackExtract(doc) {
  const body = doc.body;
  if (!body) return null;
  const container = pickContainer(body);
  if (!container) return null;
  const clone = container.cloneNode(true);
  for (const el of clone.querySelectorAll(NOISE_SELECTOR)) el.remove();
  const content = clone.innerHTML;
  if (!hasEnoughProse(content)) return null;
  return normalize({ title: null, byline: null, date: null, content }, doc);
}

// Picks the container holding the most paragraph text; falls back to the parent
// grouping the densest set of paragraphs.
function pickContainer(body) {
  const groups = new Map();
  for (const p of body.querySelectorAll("p")) {
    const parent = p.parentElement;
    if (!parent) continue;
    const entry = groups.get(parent) ?? { score: 0, count: 0 };
    entry.score += p.textContent.trim().length;
    entry.count += 1;
    groups.set(parent, entry);
  }
  let best = null;
  let bestScore = 0;
  for (const [parent, entry] of groups) {
    if (entry.count < MIN_PARAGRAPHS) continue;
    if (entry.score > bestScore) {
      best = parent;
      bestScore = entry.score;
    }
  }
  return best;
}

// Fills missing metadata from the document (byline, date, title).
function normalize(article, doc) {
  return {
    title: clean(article.title) || firstText(doc, "h1") || clean(doc.title),
    byline: clean(article.byline) || metaContent(doc, 'meta[name="author"]') || firstText(doc, '[rel="author"], .byline'),
    date: clean(article.date) || metaContent(doc, 'meta[property="article:published_time"]') || firstText(doc, "time"),
    content: article.content,
  };
}

function metaContent(doc, selector) {
  return clean(doc.querySelector(selector)?.getAttribute("content"));
}

function firstText(doc, selector) {
  return clean(doc.querySelector(selector)?.textContent);
}

function clean(value) {
  const text = value?.trim();
  return text ? text : null;
}

function hasEnoughProse(html) {
  return paragraphLengths(html).filter((n) => n >= MIN_PARAGRAPH_CHARS).length >= MIN_PARAGRAPHS;
}

function paragraphLengths(html) {
  const lengths = [];
  const regex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    lengths.push(stripTags(match[1]).length);
  }
  return lengths;
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
