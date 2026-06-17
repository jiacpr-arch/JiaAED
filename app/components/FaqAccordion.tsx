import type { FAQ, FaqCategory } from "@/lib/aed/faqs";

function FaqItem({ f }: { f: FAQ }) {
  return (
    <details className="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
      <summary className="font-semibold text-sm text-white cursor-pointer list-none flex justify-between items-center gap-3">
        {f.question}
        <span className="text-yellow-400 group-open:rotate-45 transition-transform flex-shrink-0">
          +
        </span>
      </summary>
      <p className="text-sm text-gray-400 mt-3 leading-relaxed">{f.answer}</p>
    </details>
  );
}

// Renders either a flat list (`items`) or grouped categories (`categories`).
export function FaqAccordion({
  items,
  categories,
}: {
  items?: FAQ[];
  categories?: FaqCategory[];
}) {
  if (categories && categories.length > 0) {
    return (
      <div className="space-y-8">
        {categories.map((c) => (
          <div key={c.category}>
            <h3 className="text-lg font-bold text-yellow-400 mb-3">{c.category}</h3>
            <div className="space-y-3">
              {c.items.map((f) => (
                <FaqItem key={f.question} f={f} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(items ?? []).map((f) => (
        <FaqItem key={f.question} f={f} />
      ))}
    </div>
  );
}
