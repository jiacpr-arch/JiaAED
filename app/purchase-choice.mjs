// A grant has its own random revocation token. Keep a failed withdrawal queued
// locally, so refresh, navigation, and a subsequent grant cannot undo it.
export function syncPurchaseChoice(granted) {
  if (typeof window === 'undefined' || !['jiaaed.com','www.jiaaed.com'].includes(location.hostname)) return;
  const attributes = '; Path=/; Secure; SameSite=Lax';
  const read = key => document.cookie.split('; ').find(c => c.startsWith(key + '='))?.slice(key.length + 1);
  const key = '__Secure-jia_aed_ads_receipt';
  const receiptAttributes = attributes + '; Domain=jiaaed.com';
  const campaignKey = '__Host-jia_ads_campaign';
  const pending = '__Secure-jia_aed_withdraw_';
  try {
    const token = read(key);
    if (!granted) {
      if (token) document.cookie = pending + token + '=1; Max-Age=2592000' + receiptAttributes;
      document.cookie = key + '=; Max-Age=0' + receiptAttributes;
      document.cookie = campaignKey + '=; Max-Age=0' + attributes;
    } else {
      if (!token) document.cookie = key + '=' + crypto.randomUUID() + '; Max-Age=2592000' + receiptAttributes;
      const params = new URLSearchParams(location.search);
      if (params.get('utm_source') === 'chatgpt' && params.get('utm_campaign') === 'jiaaed_quote')
        document.cookie = campaignKey + '=jiaaed_quote; Max-Age=2592000' + attributes;
    }
    for (const entry of document.cookie.split('; ').map(k => k.split('=')[0]).filter(k => k.startsWith(pending))) {
      const receipt = entry.slice(pending.length);
      fetch('/api/analytics/purchase-consent', {method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},
        body:JSON.stringify({receipt})}).then(r => {if(r.ok) document.cookie = entry + '=; Max-Age=0' + receiptAttributes}).catch(() => {});
    }
  } catch { /* Checkout remains available if browser storage is blocked. */ }
}
