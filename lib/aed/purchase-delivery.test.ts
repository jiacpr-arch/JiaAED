import {test} from 'vitest';
import assert from 'node:assert/strict';
import {receiptFromCookies,deliverPurchase} from './purchase-delivery.mjs';
const receipt='67e55044-10b1-426f-9247-bb680e5fe0c8';
const grant='jia_consent='+encodeURIComponent(JSON.stringify({v:1,marketing:true}));
const consentCookie='__Secure-jia_aed_ads_receipt='+receipt;
test('checkout attribution requires an unambiguous cookie and an explicit current choice',()=>{
  assert.equal(receiptFromCookies(consentCookie),null);
  assert.equal(receiptFromCookies(grant+'; '+consentCookie+'; '+consentCookie),null);
  assert.equal(receiptFromCookies(grant.replace('%3Atrue','%3Afalse')+'; '+consentCookie),null);
  assert.deepEqual(receiptFromCookies(grant+'; '+consentCookie+'; __oppref=ab%2Fcd'),{receipt,campaign:null,oppref:'ab%2Fcd'});
});
test('webhook delivers without a browser return, retries with the same ID and skips accepted or revoked rows',async()=>{
  const submitted:string[]=[];
  let accepted=false,revoked=false;
  async function operation(op:string){
    if(op==='claim')return accepted?{state:'skip'}:{state:'send',lease:'test',oppref:'opaque'};
    if(op==='allowed')return !revoked;
    if(op==='accepted')accepted=true;
  }
  const event={id:'stable-order',type:'order_created'};
  const submit=async (e:{id:string})=>{submitted.push(e.id);if(submitted.length===1)throw Error('temporary')};
  await deliverPurchase('sid',null,operation,submit);
  await assert.rejects(deliverPurchase('sid',event,operation,submit));
  await deliverPurchase('sid',event,operation,submit);
  await deliverPurchase('sid',event,operation,submit);
  accepted=false;revoked=true;
  await deliverPurchase('sid',event,operation,submit);
  assert.deepEqual(submitted,['stable-order','stable-order']);
});
