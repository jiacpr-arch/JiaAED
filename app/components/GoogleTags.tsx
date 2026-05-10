import Script from "next/script";

export function GoogleTags() {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
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
            if (gclid) {
              localStorage.setItem('jiaaed_gclid', gclid);
              localStorage.setItem('jiaaed_gclid_ts', String(Date.now()));
            }
            ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){
              var v = p.get(k);
              if (v) localStorage.setItem('jiaaed_' + k, v);
            });
          } catch(e) {}
        `}
      </Script>
    </>
  );
}
