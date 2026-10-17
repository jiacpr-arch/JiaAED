// Serialize structured data for a <script type="application/ld+json"> body.
// Plain JSON.stringify is not safe there: a "</script>" (or "<!--") inside any
// string value would end the script element early and let the rest render as
// HTML. Escaping <, > and & as \u-sequences keeps the JSON identical to parsers
// while making it inert to the HTML tokenizer; U+2028/2029 are escaped because
// some JS engines treat them as line terminators.
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
