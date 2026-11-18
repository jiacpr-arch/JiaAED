import {afterEach,expect,it,vi} from "vitest";
import Stripe from "stripe";
const f=vi.hoisted(()=>({retrieve:vi.fn(),rpc:vi.fn(),existing:vi.fn()}));
vi.mock("@/lib/aed/stripe",()=>({getStripe:()=>({
  webhooks: new Stripe("sk_test_synthetic").webhooks,checkout:{sessions:{retrieve:f.retrieve}}
})}));
vi.mock("@/lib/supabase/admin",()=>({createAdminClient:()=>({
  rpc:f.rpc,from:()=>({select:()=>({eq:()=>({maybeSingle:f.existing})})})
})}));
import {POST} from "./route";
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.clearAllMocks();});
it("completes a signed paid webhook without a browser return, retrying CAPI after order persistence",async()=>{
  const secret="synthetic-test-secret",id="cs_live_SyntheticOrder";
  vi.stubEnv("STRIPE_WEBHOOK_SECRET",secret);
  vi.stubEnv("OPENAI_ADS_CAPI_ENABLED","true");
  vi.stubEnv("OPENAI_ADS_CAPI_KEY","dummy");
  const metadata={product_id:"primedic-y2",openai_storefront:"1",openai_delivery:"webhook_v1"};
  const session={id,metadata,amount_total:10000,livemode:true,mode:"payment",currency:"thb",payment_status:"paid",
    payment_intent:{status:"succeeded",amount_received:10000,latest_charge:{created:Math.floor(Date.now()/1000),amount_refunded:0}}};
  f.retrieve.mockResolvedValue(session);
  f.existing.mockResolvedValue({data:{status:"paid"}});
  let accepted=false;
  f.rpc.mockImplementation(async(_name,{op})=>{
    if(op==="accepted")accepted=true;
    const data=op==="claim"?(accepted?{state:"skip"}:{state:"send",lease:"demo"}):op==="allowed"?true:{};
    return {data,error:null};
  });
  const submit=vi.fn().mockResolvedValueOnce({ok:false}).mockResolvedValue({ok:true});
  vi.stubGlobal("fetch",submit);
  const payload=JSON.stringify({type:"checkout.session.async_payment_succeeded",data:{object:session}});
  const signature=new Stripe("sk_test_synthetic").webhooks.generateTestHeaderString({payload,secret});
  const notify=()=>POST(new Request("https://jiaaed.com/api/stripe/webhook",{
    method:"POST",headers:{"stripe-signature":signature},body:payload
  }));
  expect((await notify()).status).toBe(503);
  expect((await notify()).status).toBe(200);
  expect((await notify()).status).toBe(200);
  expect(submit).toHaveBeenCalledTimes(2);
  const events=submit.mock.calls.map(call=>JSON.parse(call[1].body).events[0]);
  expect(events[0].id).toEqual(events[1].id);
  expect(events[0].data.amount).toEqual(10000);
});
