# การนำข่าวจาก JiaAED ไปแสดงที่อื่น

ข่าวทั้งหมดมาจากตาราง `aed_news_items` (เฉพาะรายการที่ไม่ถูกซ่อน) มี 2 ช่องทางให้นำไปใช้

## 1. JSON API สาธารณะ — `/api/news/public`

เหมาะกับ project อื่นที่อยากดึงข้อมูลไป render เอง เปิด CORS (`*`) เรียกจาก browser ข้ามโดเมนได้เลย

```
GET https://jiaaed.com/api/news/public?limit=10
```

Query parameters:

| พารามิเตอร์ | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `limit` | 20 | จำนวนข่าว (สูงสุด 60) |
| `topic` | — | กรองตามหัวข้อ |

ตัวอย่าง response:

```json
{
  "ok": true,
  "count": 2,
  "items": [
    {
      "id": "…",
      "source_title": "หัวข้อข่าวต้นฉบับ",
      "source_url": "https://…",
      "source_name": "ชื่อสำนักข่าว",
      "topic": "CPR",
      "our_blurb": "สรุปมุมให้ความรู้จาก JiaAED",
      "published_at": "2026-06-10T00:00:00+00:00"
    }
  ]
}
```

ตัวอย่างการใช้ใน project อื่น:

```js
const res = await fetch("https://jiaaed.com/api/news/public?limit=5");
const { items } = await res.json();
```

ผลลัพธ์ cache ไว้ 5 นาที

## 2. Embed widget — `/embed/news`

เหมาะกับเว็บที่อยากแปะข่าวโดยไม่ต้องเขียนโค้ดเอง เป็น HTML เบา ๆ สำหรับใส่ใน iframe (ไม่มี chat widget หรือ tracking ของหน้าเว็บหลักติดไปด้วย)

```html
<iframe
  src="https://jiaaed.com/embed/news?limit=5&theme=light"
  style="width: 100%; height: 600px; border: 0;"
  title="ข่าวจาก JiaAED"
></iframe>
```

Query parameters:

| พารามิเตอร์ | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `limit` | 5 | จำนวนข่าว (สูงสุด 30) |
| `theme` | `dark` | `dark` หรือ `light` |

ลิงก์ข่าวใน widget เปิดแท็บใหม่ทั้งหมด และมีเครดิตลิงก์กลับมาที่ `jiaaed.com/news` ท้าย widget

## หมายเหตุเรื่องลิขสิทธิ์

`our_blurb` เป็นข้อความสรุปของ JiaAED ส่วนลิขสิทธิ์ข่าวต้นฉบับเป็นของสำนักข่าวที่อ้างอิง — เวลานำไปแสดงที่อื่นควรคงลิงก์ `source_url` ไปยังแหล่งข่าวเดิมไว้เสมอ
