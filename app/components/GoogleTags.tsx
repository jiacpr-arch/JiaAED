import Script from "next/script";

export function GoogleTags() {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || "G-4PZZC620E2";
  const gAdsId = process.env.NEXT_PUBLIC_GADS_ID;

  const tagId = ga4Id || gAdsId;
  if (!tagId) return null;

  const configs = [ga4Id, gAdsId].filter(Boolean) as string[];

  return (
    <>
      <Script
        id="gtag-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${configs.map((id) => `gtag('config', '${id}');`).join("\n")}
          try {
            var p = new URLSearchParams(window.location.search);
            var gclid = p.get('gclid');
            var gbraid = p.get('gbraid');
            var wbraid = p.get('wbraid');
            if (gclid) {
              localStorage.setItem('jiaaed_gclid', gclid);
              localStorage.setItem('jiaaed_gclid_ts', String(Date.now()));
            }
            if (gbraid) localStorage.setItem('jiaaed_gbraid', gbraid);
            if (wbraid) localStorage.setItem('jiaaed_wbraid', wbraid);
            ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){
              var v = p.get(k);
              if (v) localStorage.setItem('jiaaed_' + k, v);
            });

            // Anonymous fingerprint for ad_visits ↔ later conversion lookup
            var fp = localStorage.getItem('jiaaed_fp');
            if (!fp) {
              fp = (Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
              localStorage.setItem('jiaaed_fp', fp);
            }

            // Beacon /api/aed/track-visit once per session
            if (!sessionStorage.getItem('jiaaed_visit_sent')) {
              sessionStorage.setItem('jiaaed_visit_sent', '1');
              var payload = {
                gclid: localStorage.getItem('jiaaed_gclid'),
                gbraid: localStorage.getItem('jiaaed_gbraid'),
                wbraid: localStorage.getItem('jiaaed_wbraid'),
                utm: {
                  source: localStorage.getItem('jiaaed_utm_source'),
                  medium: localStorage.getItem('jiaaed_utm_medium'),
                  campaign: localStorage.getItem('jiaaed_utm_campaign'),
                  term: localStorage.getItem('jiaaed_utm_term'),
                  content: localStorage.getItem('jiaaed_utm_content'),
                },
                fingerprint: fp,
                pageUrl: window.location.href,
                referrer: document.referrer || null,
              };
              fetch('/api/aed/track-visit', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true,
              }).catch(function(){});
            }
          } catch(e) {}
        `}
      </Script>
    </>
  );
}
