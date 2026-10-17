import React from "react";

/**
 * Minimal markdown renderer for trusted in-repo article content.
 * Supports: ## h2, ### h3, paragraphs, - bullet lists, 1. numbered lists,
 * [text](url) links, **bold**.
 * Not a general-purpose renderer — only what our articles need.
 */

/**
 * Returns the href if it's one we're willing to render as a link — http(s),
 * a site-relative path ("/…"), an in-page anchor ("#…"), tel: or mailto: —
 * otherwise null so the caller renders the label as plain text. Articles are
 * in-repo, but the web chat renders AI replies with the same rule, and a
 * `javascript:`/`data:` href must never become a clickable link.
 */
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (h.startsWith("//")) return null; // protocol-relative → arbitrary host
  if (h.startsWith("/") || h.startsWith("#")) return h;
  if (/^(https?:\/\/|tel:|mailto:)/i.test(h)) return h;
  return null;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split into tokens for [text](url) and **bold**
  const nodes: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      const href = safeHref(match[2]);
      if (!href) {
        nodes.push(match[1]);
        last = regex.lastIndex;
        continue;
      }
      const isExternal = /^https?:\/\//i.test(href);
      nodes.push(
        <a
          key={`${keyPrefix}-l-${i++}`}
          href={href}
          className="text-yellow-400 hover:text-yellow-300 underline"
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {match[1]}
        </a>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`} className="font-semibold text-white">
          {match[3]}
        </strong>,
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

export function renderMarkdown(src: string): React.ReactNode {
  const lines = src.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let listOrdered = false;
  let paraBuf: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuf.length === 0) return;
    const items = listBuf.map((it, i) => (
      <li key={i}>{renderInline(it, `li-${key}-${i}`)}</li>
    ));
    blocks.push(
      listOrdered ? (
        <ol key={`ol-${key++}`} className="list-decimal list-outside pl-6 space-y-1 my-3 text-gray-300">
          {items}
        </ol>
      ) : (
        <ul key={`ul-${key++}`} className="list-disc list-outside pl-6 space-y-1 my-3 text-gray-300">
          {items}
        </ul>
      ),
    );
    listBuf = [];
  };

  const pushListItem = (ordered: boolean, text: string) => {
    // A switch between "-" and "1." starts a new list rather than merging.
    if (listBuf.length > 0 && listOrdered !== ordered) flushList();
    listOrdered = ordered;
    listBuf.push(text);
  };

  const flushPara = () => {
    if (paraBuf.length === 0) return;
    const text = paraBuf.join(" ");
    blocks.push(
      <p key={`p-${key++}`} className="text-gray-300 leading-relaxed my-3">
        {renderInline(text, `p-${key}`)}
      </p>,
    );
    paraBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flushList();
      flushPara();
      blocks.push(
        <h3 key={`h3-${key++}`} className="text-lg font-bold text-white mt-6 mb-2">
          {renderInline(line.slice(4), `h3-${key}`)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(
        <h2 key={`h2-${key++}`} className="text-2xl font-bold text-yellow-400 mt-8 mb-3">
          {renderInline(line.slice(3), `h2-${key}`)}
        </h2>,
      );
    } else if (/^-\s+/.test(line)) {
      flushPara();
      pushListItem(false, line.replace(/^-\s+\[\s?[xX ]?\]\s+/, "").replace(/^-\s+/, ""));
    } else if (/^\d+[.)]\s+/.test(line)) {
      flushPara();
      pushListItem(true, line.replace(/^\d+[.)]\s+/, ""));
    } else if (line === "") {
      flushList();
      flushPara();
    } else {
      flushList();
      paraBuf.push(line);
    }
  }
  flushList();
  flushPara();

  return <>{blocks}</>;
}
