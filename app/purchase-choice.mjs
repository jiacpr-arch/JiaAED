// A grant has its own random revocation token. Keep a failed withdrawal queued
// locally, so refresh, navigation, and a subsequent grant cannot undo it.
export function syncPurchaseChoice(granted) {
  if (typeof window === 'undefined' || !['jiaaed.com','www.jiaaed.com'].includes(location.hostname)) return;
  const attributes = '; Path=/; Secure; SameSite=Lax';
  const read = key => document.cookie.split('; ').find(c => c.startsWith(key + '='))?.slice(key.length + 1);
  const key = '__Host-jia_ads_receipt';
  const campaignKey = '__Host-jia_ads_campaign';
  const pending = 'jia-ads-pending-revoke:';
  try {
    const token = read(key);
    if (!granted) {
      if (token) localStorage.setItem(pending + token, '1');
      document.cookie = key + '=; Max-Age=0' + attributes;
      document.cookie = campaignKey + '=; Max-Age=0' + attributes;
    } else {
      if (!token) document.cookie = key + '=' + crypto.randomUUID() + '; Max-Age=2592000' + attributes;
      const params = new URLSearchParams(location.search);
      if (params.get('utm_source') === 'chatgpt' && params.get('utm_campaign') === 'jiaaed_quote')
        document.cookie = campaignKey + '=jiaaed_quote; Max-Age=2592000' + attributes;
    }
    for (const entry of Object.keys(localStorage).filter(k => k.startsWith(pending))) {
      const receipt = entry.slice(pending.length);
      fetch('/api/analytics/purchase-consent', {method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},
        body:JSON.stringify({receipt})}).then(r => {if(r.ok) localStorage.removeItem(entry)}).catch(() => {});
    }
  } catch { /* Checkout remains available if browser storage is blocked. */ }
}
