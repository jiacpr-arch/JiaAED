// The same Stripe session and event ID are reused on every delivery attempt.
export function receiptFromCookies(cookies) {
  const values = (name) => (cookies || '').split(';').map(x => x.trimStart())
    .filter(x => x.startsWith(name + '=')).map(x => x.slice(name.length + 1));
  const choices = values('jia_consent');
  try {
    if (choices.length !== 1) return null;
    const choice = JSON.parse(decodeURIComponent(choices[0]));
    if (choice.v !== 1 || choice.marketing !== true) return null;
  } catch { return null; }
  const [receipt, ...extra] = values('__Secure-jia_aed_ads_receipt');
  if (extra.length || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receipt || '')) return null;
  const refs = values('__oppref');
  const campaigns = values('__Host-jia_ads_campaign');
  return {receipt, campaign: campaigns.length === 1 && campaigns[0] === 'jiaaed_quote' ? campaigns[0] : null,
    oppref: refs.length === 1 && /^[\x21-\x7e]{1,2048}$/.test(refs[0]) ? refs[0] : null};
}

export async function deliverPurchase(session, event, operation, submit) {
  if (!event) return;
  const claim = await operation('claim', {session});
  if (claim.state === 'skip') return;
  if (claim.state !== 'send' || !claim.lease) throw new Error('Delivery is busy');
  const attempt = {session, lease: claim.lease};
  try {
    if (!(await operation('allowed', attempt))) {
      await operation('failed', attempt);
      return;
    }
    await submit(claim.oppref ? {...event, oppref: claim.oppref} : event);
  } catch (error) {
    await operation('failed', attempt);
    throw error;
  }
  await operation('accepted', attempt);
}
