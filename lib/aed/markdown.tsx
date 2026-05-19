import React from "react";

/**
 * Minimal markdown renderer for trusted in-repo article content.
 * Supports: ## h2, ### h3, paragraphs, - bullet lists, [text](url) links, **bold**.
 * Not a general-purpose renderer — only what our articles need.
 */

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
      const href = match[2];
      const isExternal = /^https?:\/\//.test(href);
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
  let paraBuf: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuf.length === 0) return;
    const items = listBuf;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc list-outside pl-6 space-y-1 my-3 text-gray-300">
        {items.map((it, i) => (
          <li key={i}>{renderInline(it, `li-${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    listBuf = [];
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
      listBuf.push(line.replace(/^-\s+\[\s?[xX ]?\]\s+/, "").replace(/^-\s+/, ""));
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
