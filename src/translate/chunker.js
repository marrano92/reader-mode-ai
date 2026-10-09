// Splits article DOM into translatable text segments around media nodes,
// so images, video and embeds are never sent to the provider (decision D3).
const BLOCK_SELECTOR = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "figcaption",
  "td", "th", "dd", "dt", "cite", "summary", "legend",
].join(", ");

const MEDIA_SELECTOR = [
  "img", "picture", "source", "video", "audio", "iframe", "embed", "object",
  "svg", "canvas", "script", "style", "noscript",
].join(", ");

const BOUNDARY_SELECTOR = `${MEDIA_SELECTOR}, ${BLOCK_SELECTOR}`;

// Returns [{ nodes, html }] in block order; each segment is a maximal run of
// inline nodes that contains no media and no nested block.
export function collectSegments(root) {
  const segments = [];
  const blocks = [...root.querySelectorAll(BLOCK_SELECTOR)];
  // The root itself can be a block (e.g. the reader title heading).
  if (root.nodeType === 1 && root.matches?.(BLOCK_SELECTOR)) blocks.unshift(root);
  for (const block of blocks) {
    let run = [];
    const flush = () => {
      if (run.length) segments.push({ nodes: run, html: run.map(serialize).join("") });
      run = [];
    };
    for (const node of [...block.childNodes]) {
      if (isBoundary(node)) flush();
      else run.push(node);
    }
    flush();
  }
  return segments.filter((segment) => segment.html.trim() !== "");
}

// Groups segments into requests under maxChars, preserving order.
export function splitIntoChunks(segments, maxChars) {
  const chunks = [];
  let current = { segments: [], texts: [], chars: 0 };
  for (const segment of segments) {
    if (current.texts.length && current.chars + segment.html.length > maxChars) {
      chunks.push(current);
      current = { segments: [], texts: [], chars: 0 };
    }
    current.segments.push(segment);
    current.texts.push(segment.html);
    current.chars += segment.html.length;
  }
  if (current.texts.length) chunks.push(current);
  return chunks;
}

// Replaces a segment's node run with translated HTML, leaving media untouched.
export function replaceSegmentHtml(segment, html) {
  const first = segment.nodes[0];
  const parent = first?.parentNode;
  if (!parent) return;
  const template = parent.ownerDocument.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const newNodes = [...fragment.childNodes];
  parent.insertBefore(fragment, first);
  for (const node of segment.nodes) node.remove();
  segment.nodes = newNodes;
}

function isBoundary(node) {
  return node.nodeType === 1 && (node.matches(BOUNDARY_SELECTOR) || node.querySelector(BOUNDARY_SELECTOR));
}

function serialize(node) {
  return node.nodeType === 3 ? escapeText(node.textContent) : node.outerHTML;
}

function escapeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
