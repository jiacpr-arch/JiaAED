-- ═══════════════════════════════════════════════════════
-- Jia AED — add product_model to aed_units + repair the Google Sheet import
-- Additive + backward compatible. Run BEFORE deploying the API change.
-- ═══════════════════════════════════════════════════════
--
-- WHY
-- The 53 rows in aed_units were imported from the owner's Google Sheet
-- "รวม pad batt aed หมดอายุ 7" (supabase/aed_units.sql explains the import).
-- That sheet's "สินค้า" column is a *group header*: it's filled in only on the
-- first row of each product group, and the rows under it inherit that value by
-- being left blank. The import read row-by-row, so it saw 45 blanks and gave
-- up — stamping each one with a "⚠️ ไม่ทราบว่าเป็นแผ่นหรือแบต" note and
-- defaulting the date into pad_expiry_date.
--
-- Forward-filling the sheet's group headers recovers all 45 exactly (no
-- guessing): the group boundaries reconcile 53/53 against the imported
-- expiry dates. Two of those rows turn out to belong to the `batt a15`
-- group and were therefore filed as pads by mistake — this migration moves
-- them to battery_expiry_date, which changes what the weekly
-- /api/cron/unit-expiry-check alert calls them.
--
-- The product is now a real column instead of prose buried in notes, so
-- /admin/units can edit it and the expiry alert can name the exact part to
-- order. Nullable: rows added by hand may legitimately not know it yet.

ALTER TABLE aed_units ADD COLUMN IF NOT EXISTS product_model TEXT;

-- ── 1) Backfill product_model by forward-filling the sheet's group headers ──
-- Grouped by customer_name because the import left serial_number NULL on every
-- row (the source sheet has no serial column at all).

UPDATE aed_units SET product_model = 'pad zoll' WHERE customer_name IN (
  'บริษัทแฮปปี้เชฟ(ประเทศไทย)จำกัด (คุณสุนันทา)',
  'บริษัท เนวี่ เมดิค 36 จำกัด (จตุรงค์ ขุนแสน)'
);

UPDATE aed_units SET product_model = 'batt a15' WHERE customer_name IN (
  'บริษัท ผลิผล จำกัด (ณปภัช)',
  'หจก.อัลฟ่า เฮลร์ คลับ(เจี๊ยบ)',
  'โรงเรียนสายน้ำผึ้ง ในพระอุปถัมป์ฯ (วชิราพร)'
);

-- เทวาศรม appears twice in the sheet — once for a pad and once for a battery.
-- Disambiguate on which date column the import filled.
UPDATE aed_units SET product_model = 'batt ในเครื่อง yuwell'
WHERE customer_name = 'บริษัท เทวาศรม เขาหลัก จำกัด (คุณ นิภารัตน์)'
  AND battery_expiry_date IS NOT NULL;

UPDATE aed_units SET product_model = 'pad ใน เครื่อง yuwell'
WHERE customer_name IN (
  'โรจนี ลีลากุล',
  'ห้างหุ้นส่วนจำกัด ฮาวายไนท์คลับ (คุณ ธนบัตร)'
) OR (customer_name = 'บริษัท เทวาศรม เขาหลัก จำกัด (คุณ นิภารัตน์)' AND pad_expiry_date IS NOT NULL);

UPDATE aed_units SET product_model = 'pad philllp' WHERE customer_name IN (
  'รัตนา ทรายทอง',
  'ห้างหุ้นส่วนจำกัด จี. พี. เอส. กรุ๊ฟ',
  'บริษัท โคซี่ แคร์ จำกัด',
  'บริษัท กัทส์ ซุปเปอร์โพลส์ จำกัด',
  'อุษยาวรรณ์ สัมพัฒนวรชัย',
  'ห้างหุ้นส่วนจำกัด คูณดี เนอร์สซิ่งโฮม',
  'เอกฤทธิ์ ติรณะประกิจ',
  'ห้างหุ้นส่วนจำกัด เคที เมดิคอล',
  'จีเนียส บิสซิเนส คุณนงนุช',
  'เรียน เจ้ากรมการสื่อสารทหารี กองบัญชาการกองทัพไทย',
  'บริษัทไอทอส คอร์ปอเรชั่น จำกัด'
);
-- The one sheet row with no customer name at all (phone 086-846-2002, bought
-- 9 Sep 2024) sits inside the same `pad philllp` group.
UPDATE aed_units SET product_model = 'pad philllp' WHERE customer_name IS NULL;

UPDATE aed_units SET product_model = 'pad feedback yuwell'
WHERE customer_name = 'บริษัท สเปย์ เทคโนโลยี (ไทยแลนด์) จำกัด';

UPDATE aed_units SET product_model = 'pad feedback yuwell aed' WHERE customer_name IN (
  'บริษัท คอมมอนแอเรีย จำกัด',
  'บริษัท ซีเครสท์ มารีน จำกัด',
  'บริษัท แอมมี่ กรุ๊ป จำกัด',
  'บริษัท พีพีพี โฮเต็ล แอนด์ รีสอร์ท จำกัด',
  'บริษัท ด๊อกเตอร์อาสา เฮลท์ จำกัด',
  'บริษัท วายทีที เอ็นจิเนียริ่ง คอนสตรัคชั่น (ประเทศไทย) จำกัด',
  'บริษัท เฟล็กซ์ รีแฮบ จำกัด',
  'บริษัท เดนทัล ออน จำกัด',
  'บริษัท สไมล์ รีพับบลิก จำกัด',
  'บ้านปัญญเวช (น.ส. นวพรรณ ตั้งตระกูล)',
  'บริษัท ไวส์พลัสเทรดดิ้ง จำกัด',
  'บริษัท เมดิเรน จำกัด',
  'สำนักงานปลัดกระทรวงยุติธรรม',
  'ห้างหุ้นส่วนจำกัด ยางชุมน้อยรุ่งโรจน์',
  'โรงเรียนสารสาสน์เอกตรา',
  'บริษัท เอส.ไอ.พี.สยามอินเตอร์แปซิฟิค จำกัด',
  'บริษัท เซ็นทรัล ปาร์ค จำกัด',
  'บริษัท นครชัยแอร์ จำกัด',
  'บริษัท วินเนอร์คลับ จำกัด',
  'บริษัท ซิมไบโอ (ไทยแลนด์) จำกัด',
  'บริษัท วีแคร์เมดิคอล จำกัด',
  'บริษัท รอยัลเมืองสมุยวิลล่า จำกัด',
  'ห้างหุ้นส่วนจำกัด นาวาศิริ กรุ๊ป'
);

UPDATE aed_units SET product_model = 'pad ในเครื่อง phillip' WHERE customer_name IN (
  'บริษัท อีลีทโวค จำกัด',
  'คลินิกผิวหนังแพทย์นิวัติ',
  'คลินิก สมอง หมอธนากร',
  'Save the Children Thailand',
  'King''s College International School Bangkok',
  'บริษัท เอฟดีจีที จำกัด',
  'บริษัท นนชนันท์ เฮลท์แคร์ จำกัด',
  'นิติบุคคลอาคารชุด หลังสวนวิลล์'
);

-- ── 2) Move the two misfiled batteries out of the pad column ────────────────
-- Both inherit `batt a15` from บริษัท ผลิผล and were imported as pads, so the
-- weekly alert has been calling them "แผ่นอิเล็กโทรด" since 6 Aug 2026.
UPDATE aed_units
SET battery_expiry_date = pad_expiry_date,
    pad_expiry_date = NULL
WHERE product_model = 'batt a15' AND pad_expiry_date IS NOT NULL;

-- ── 3) Drop the now-answered warning and the duplicated raw product text ────
-- Everything else in notes (phone number, ผู้ดูแล, import provenance) stays.
UPDATE aed_units
SET notes = NULLIF(
      regexp_replace(
        regexp_replace(notes, '\s*\|\s*(⚠️ แถวต้นฉบับไม่มีคอลัมน์[^|]*|สินค้าดิบ:[^|]*)', '', 'g'),
        '\s+$', ''
      ),
      ''
    )
WHERE notes ~ '⚠️ แถวต้นฉบับไม่มีคอลัมน์|สินค้าดิบ:';

UPDATE aed_units SET updated_at = NOW();

-- ── Verify: expect 49 pads / 4 batteries, 53 rows all with a product_model ──
--   SELECT product_model,
--          count(*) FILTER (WHERE pad_expiry_date IS NOT NULL)     AS pads,
--          count(*) FILTER (WHERE battery_expiry_date IS NOT NULL) AS batts
--   FROM aed_units GROUP BY 1 ORDER BY 1;
