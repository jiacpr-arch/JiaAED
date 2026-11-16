# คู่มือกลาง: กันวงเงินบัตรผ่าน Stripe (ใช้ซ้ำกับระบบอื่นในบริษัท)

> สรุปจากระบบเช่า AED อีเวนต์ของ JiaAED (พ.ย. 2026) ใช้เป็นแม่แบบให้ระบบอื่นในบริษัทที่ใช้บัญชี Stripe **Jia1669** ร่วมกัน
> (Jia1669, Morroo, Roodee, PharmRoo ฯลฯ) เช่น เช่าหุ่น CPR, มัดจำคอร์ส หรือยืมอุปกรณ์
> โค้ดต้นแบบอยู่ใน repo นี้ ดูหัวข้อ "ไฟล์ต้นแบบ" ท้ายเอกสาร

## 1. หลักการ
- "กันวงเงิน" คือขออนุมัติยอดบนบัตร (authorize) แต่ **ยังไม่ตัดเงิน** ยอดนี้ลดวงเงินบัตรของลูกค้าไว้ชั่วคราว
- เมื่อจบงาน เลือกได้ 2 ทาง:
  - **เก็บเงิน (capture)** ทั้งหมดหรือบางส่วน ส่วนที่ไม่ได้เก็บจะปล่อยคืนบัตรเอง
  - **ยกเลิก (cancel)** ปล่อยคืนทั้งหมด ไม่มีค่าธรรมเนียม
- ค่าธรรมเนียมบัตรคิด **เฉพาะยอดที่ capture** ตอนกันวงเงินหรือยกเลิกไม่เสียค่าธรรมเนียม
- ใช้ได้กับ **บัตรเท่านั้น** (PromptPay กันวงเงินไม่ได้)

## 2. ข้อจำกัดเวลา (สำคัญที่สุด)
- วงเงินบัตรค้างได้ประมาณ **7 วัน** จากนั้นหลุดเอง (`payment_intent.canceled`) ถ้าจะกันได้ 30 วัน ต้องเปลี่ยนเป็นแผนราคา IC+ ของ Stripe
- ดังนั้นขายแบบกันวงเงินได้เฉพาะงานที่จบภายใน **6 วัน** (เผื่อ 1 วัน) ตรวจด้วย `HOLD_MAX_RETURN_DAYS = 6`
- ใน DB เก็บ `capture_before` ไว้ และมี cron เตือน LINE ล่วงหน้า 36 ชม. ก่อนหมดอายุ
- งานที่เกิน 6 วัน ไม่ใช้วิธีกันวงเงิน ให้ใช้มัดจำจริง หรือตัดบัตรรายเดือน (subscription)

## 3. Flow
1. Admin สร้างลิงก์ (Checkout Session) แล้วส่งให้ลูกค้าทาง LINE หรืออีเมล
2. ลูกค้ากรอกบัตรและ OTP จนเห็นหน้า "กันวงเงินเรียบร้อย"
3. Webhook `checkout.session.completed` (metadata `kind`) เข้ามา ระบบ upsert แถวใน DB ด้วย `payment_intent_id` แล้วส่ง LINE "🔒"
4. เมื่อจบงาน ทำอย่างใดอย่างหนึ่ง:
   - คืนตรงเวลา: **capture เฉพาะค่าเช่า** (+ ค่าเสียหายถ้ามี) ส่วนมัดจำปล่อยคืนเอง
   - ยกเลิกงาน: **cancel** ไม่เสียค่าธรรมเนียม
   - ใกล้หมดอายุแต่ยังไม่คืนของ: **capture เต็มวงเงิน** ก่อนหลุด แล้วค่อย **refund ส่วนเกิน** เมื่อได้ของคืน (ดูข้อ 5)

## 4. โค้ด Stripe ที่ใช้
```ts
// สร้างลิงก์กันวงเงิน
stripe.checkout.sessions.create({
  mode: "payment",
  payment_method_types: ["card"],               // บัตรเท่านั้น
  payment_intent_data: {
    capture_method: "manual",                   // ← หัวใจของการกันวงเงิน
    metadata: { kind: "<system>_hold", ... },   // metadata ต้องอยู่ที่ PI ด้วย
  },
  metadata: { kind: "<system>_hold", ... },
  expires_at: now + 23h,
  line_items: [ค่าเช่า (รวม VAT), มัดจำ (ไม่มี VAT)],
});

stripe.paymentIntents.capture(pi, { amount_to_capture: satang(rent + damage) });  // เก็บบางส่วน
stripe.paymentIntents.cancel(pi);                                                 // ปล่อยทั้งหมด

// refund ส่วนเกินหลัง capture เต็ม: อ่านค่าธรรมเนียมจริงจาก balance_transaction
const pi = await stripe.paymentIntents.retrieve(id, { expand: ["latest_charge.balance_transaction"] });
stripe.refunds.create({ payment_intent: id, amount }, { idempotencyKey: `hold-excess-${rowId}` });
```

## 5. นโยบายคืนช้า (เจ้าของอนุมัติ 16 พ.ย. 2026)
- **ไม่มีค่าปรับคงที่**
- คิดค่าเช่าวันที่เกินตามเรท (AED: 900 บาท/วัน + VAT)
- ถ้าต้อง capture เต็มวงเงินก่อนหลุด ลูกค้าต้อง **รับค่าธรรมเนียมบัตรในส่วนที่คืน**
  - สูตร: `refund = captured − keep − fee × (captured − keep) / captured`
  - ใช้ค่าธรรมเนียมจริงจาก Stripe ไม่ใช้ % ประมาณ
- ต้องเขียนไว้ในสัญญา ดูข้อ 3.3 ใน `lib/aed/rental-terms.ts`

## 6. บทเรียนจากบัญชี Stripe ที่ใช้ร่วมกัน (ทุกระบบต้องทำ)
- **กรอง event ของระบบตัวเอง**: webhook ได้รับ event ของทุกธุรกิจในบัญชี Jia1669
  - กรองด้วย `metadata.kind` หรือ product_id ในแคตตาล็อกของตัวเอง
  - event ที่ไม่ใช่ของระบบเรา ให้ตอบ 200 แล้วข้าม ห้ามบันทึกลง DB
- **แยก webhook endpoint ต่อระบบ** และใช้ signing secret ของ endpoint นั้นเท่านั้น
  - ลบ endpoint เก่าทิ้ง ถ้าค้างไว้จะเจอ signature 400 ซ้ำ ๆ
- **API version ของ endpoint** อาจเก่ากว่า SDK (ของ JiaAED คือ 2022-11-15 แต่ SDK เป็น basil) ให้โค้ดอ่าน field ได้ทั้งสองรูปแบบ
- **หน้าเว็บที่ถูก iframe** (เช่น ฝังใน jia1669.com) ต้องใส่ `target="_top"` ที่ฟอร์มหรือลิงก์ไป Stripe ไม่งั้นกดจ่ายไม่ได้
- **ชื่อบนหน้า Stripe** จะแสดงเป็น "Jia1669" ทุกระบบ ถ้าจะให้ขึ้นชื่อแบรนด์ต้องตั้ง branding หรือ statement descriptor suffix แยก
- Admin action ที่เคลื่อนเงิน ใส่ **idempotency key** ทุกครั้ง และส่ง LINE แจ้งเจ้าของ (`pushToOwner`)

## 7. ฐานข้อมูล (Supabase jia-unified)
- ใช้ตาราง `aed_rental_holds` เป็นแม่แบบ (`supabase/aed_rental_billing.sql`):
  - `payment_intent_id` UNIQUE
  - `status` ∈ authorized / captured / released / expired
  - `rent_thb`, `hold_thb`, `authorized_thb`, `captured_thb`, `refunded_thb`, `damage_thb`
  - `capture_before`, `return_date`
  - ข้อมูลลูกค้า
- เปิด RLS ให้ใช้ได้เฉพาะ service_role
- ระบบใหม่ให้ตั้งชื่อตารางตาม prefix ของระบบ (เช่น `cpr_rental_holds`) อย่าใช้ตารางเดียวกันปนกัน

## 8. เช็กลิสต์ทดสอบ (live)
1. สร้างลิงก์จาก admin
2. **กรอกบัตรจริงจนผ่าน OTP และเห็นหน้าสำเร็จ** (ถ้ากด ← ย้อนกลับบนหน้า Stripe จะไม่มีอะไรเกิดขึ้น)
3. ต้องได้ LINE "🔒" และมีแถวใหม่ใน DB สถานะ `authorized`
4. จากนั้นค่อยกด "ยกเลิก" ใน admin สถานะต้องเป็น `released` ไม่เสียค่าธรรมเนียม
5. ยอดในแอปธนาคารอาจค้างอยู่ 1–7 วันตามรอบของธนาคาร

## 9. กฎขอบเขตที่ใช้ร่วม
- **เพดานต่อลูกค้า** (สัญญาตัดบัตรรายเดือน ไม่รวมกันวงเงิน): ดู `lib/aed/credit-limits.ts`
  - บุคคล: 1 เครื่อง
  - นิติบุคคล: 2 เครื่อง
  - จ่ายตรงครบ ≥ 3 งวด: เพิ่มได้ทีละ 2 เครื่อง
  - มีงวดค้างชำระ: เปิดสัญญาใหม่ไม่ได้
  - เกินเพดาน: admin override ได้โดยต้องใส่เหตุผล (log ลง LINE)
- **ราคา**: แสดงแบบ "ex VAT" และบวก VAT 7% ตอน checkout ส่วนมัดจำไม่มี VAT

## ไฟล์ต้นแบบ
| เรื่อง | ไฟล์ |
|---|---|
| แพ็กเกจและสูตรคำนวณ (pure) | `lib/aed/rental-holds.ts` |
| สร้าง Checkout Session | `lib/aed/checkout-sessions.ts` (`createHoldSession`) |
| Webhook | `lib/aed/rental-holds-webhook.ts`, `app/api/stripe/webhook/route.ts` |
| Capture / release / refund | `lib/aed/refund-actions.ts`, `lib/aed/refunds.ts` |
| Admin API และหน้าจอ | `app/api/admin/rental-billing/route.ts`, `app/admin/billing/page.tsx` |
| Cron เตือนใกล้หมดอายุ | `app/api/cron/rental-holds/route.ts` (vercel.json `0 2,9 * * *`) |
| คู่มือใช้งานฝั่ง JiaAED | `docs/online-checkout-2026-11-16.md` |
