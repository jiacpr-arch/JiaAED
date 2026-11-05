import type { FormEvent, ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MiniLeadForm } from "./MiniLeadForm";
import { QuoteForm } from "./QuoteForm";

// Exercise the real submit handlers without a DOM or any provider/network calls.
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: vi.fn(),
  useRef: (value: unknown) => ({ current: value }),
  useState: (value: unknown) => [value, vi.fn()],
}));
vi.mock("../openai-ads", () => ({ pixelLeadCreated: vi.fn() }));
vi.mock("@/lib/aed/analytics-client", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/aed/fb-tracking", () => ({
  readFbTracking: () => ({}), newEventId: () => "local-test-event", fireMetaLead: vi.fn(),
}));

const gtag = vi.fn();
const fetchMock = vi.fn();
let consent: string | null;
let storageThrows: boolean;

beforeEach(() => {
  vi.clearAllMocks();
  consent = "granted";
  storageThrows = false;
  vi.stubGlobal("window", {
    gtag,
    location: { href: "https://local.test/quote" },
    localStorage: {
      getItem: (key: string) => {
        if (storageThrows) throw new Error("Storage unavailable");
        return key === "jia_cookie_consent" ? consent : null;
      },
    },
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("FormData", class {
    get(key: string) { return key === "phone" ? "local-only-test" : ""; }
  });
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
});

afterEach(() => vi.unstubAllGlobals());

function submit(render: () => ReactElement) {
  const form = render() as ReactElement<{ onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }>;
  return form.props.onSubmit({
    preventDefault: vi.fn(), currentTarget: { reset: vi.fn() },
  } as unknown as FormEvent<HTMLFormElement>);
}

describe.each([
  ["MiniLeadForm", () => MiniLeadForm()],
  ["QuoteForm", () => QuoteForm({})],
] as const)("%s Google Ads form conversion", (_name, render) => {
  it("waits for successful persistence, then sends the verified zero-value action once", async () => {
    let resolve!: (response: unknown) => void;
    fetchMock.mockReturnValue(new Promise((done) => { resolve = done; }));
    const pending = submit(render);
    expect(gtag).not.toHaveBeenCalled();
    resolve({ ok: true, json: async () => ({ ok: true }) });
    await pending;
    expect(gtag.mock.calls.filter((args) => args[1] === "conversion")).toEqual([
      ["event", "conversion", { send_to: "AW-873507669/-UU0CKTs79gcENXWwqAD", value: 0, currency: "THB" }],
    ]);
  });

  it.each([null, "denied"])("does not send when consent is %s, even if gtag already exists", async (choice) => {
    consent = choice;
    await submit(render);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("fails closed when consent storage is unavailable", async () => {
    storageThrows = true;
    await submit(render);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("rechecks consent when the successful response arrives", async () => {
    fetchMock.mockImplementation(async () => {
      consent = "denied";
      return { ok: true, json: async () => ({ ok: true }) };
    });
    await submit(render);
    expect(gtag).not.toHaveBeenCalled();
  });

  it.each([
    { ok: false, body: { ok: false } },
    { ok: true, body: { ok: false } },
    { ok: true, body: { ok: true, skipped: "honeypot" } },
    { ok: true, body: { ok: true, skipped: "duplicate" } },
  ])("does not count failed or skipped submissions: %j", async ({ ok, body }) => {
    fetchMock.mockResolvedValue({ ok, json: async () => body });
    await submit(render);
    expect(gtag).not.toHaveBeenCalled();
  });
});
