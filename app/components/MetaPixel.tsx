import Script from "next/script";

// Meta (Facebook/Instagram) Pixel — browser side. Pairs with lib/aed/meta-capi.ts
// (server side) using a shared event_id for deduplication. Renders nothing until
// NEXT_PUBLIC_META_PIXEL_ID is set, so the landing page is unaffected when unset.
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
          try {
            // Persist fbclid the same way GoogleTags persists gclid, so a form
            // submit on a later page can still attribute back to the ad click.
            var p = new URLSearchParams(window.location.search);
            var fbclid = p.get('fbclid');
            if (fbclid) {
              localStorage.setItem('jiaaed_fbclid', fbclid);
              localStorage.setItem('jiaaed_fbclid_ts', String(Date.now()));
            }
          } catch(e) {}
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's required noscript fallback; next/image can't render inside <noscript> */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
