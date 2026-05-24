# 📖 Glossary

คำศัพท์ที่ใช้บ่อยในโปรเจ็กต์ — เพื่อให้ทุกคนเข้าใจตรงกัน

## 🎮 Game Terms

| คำ | ความหมาย |
|---|---|
| **Daily Puzzle** | Puzzle 1 อันต่อวันที่ทุกคนทั่วโลกได้เหมือนกัน, reset เที่ยงคืน UTC |
| **Stage** | ด่านใน practice mode (ไม่ใช่ daily) — 100 ด่าน × 4 ระดับ |
| **Streak** | จำนวนวันที่เล่น Daily Puzzle ต่อเนื่อง |
| **Streak Freeze** | Item ที่ใช้กันไม่ให้ streak หลุดเมื่อพลาด 1 วัน |
| **Daily Quest** | ภารกิจรายวัน 3 อัน ทำเสร็จได้ coin/XP |
| **Hint** | ตัวช่วยที่เปิดเฉลย 1 ช่อง — มี 3 ครั้งต่อ puzzle |
| **Mistake** | กรอกเลขไม่ตรงกับเฉลย นับขึ้นทุกครั้ง ไม่หักออก |
| **Conflict** | กรอกเลขที่ขัดกฎ Sudoku (ซ้ำใน row/col/box) — แค่เตือน ไม่นับเป็น mistake ถ้าตรงเฉลย |
| **Given** | ช่องที่ระบบให้มาตั้งแต่ต้น แก้ไขไม่ได้ |
| **Solution** | เฉลยของ puzzle (9×9 ตาราง) |
| **Pencil Mark** | (Future) เลขเล็กที่ผู้เล่นจดในช่องเพื่อ tracking ความเป็นไปได้ |

## 🏆 Progression

| คำ | ความหมาย |
|---|---|
| **XP** | Experience point — ได้จากเล่น, สะสมเพื่อ level up |
| **Level** | ระดับผู้เล่น 1-100, ปลดล็อก item/feature ตาม level |
| **Coin** | สกุลเงินในเกม ใช้ซื้อ theme/avatar |
| **Gem** | (Future) สกุลเงินพรีเมียม ซื้อจริง |
| **Achievement** | เป้าหมายระยะยาวที่ปลดล็อกครั้งเดียว, ได้รางวัล coin/item |

## 🎨 Customization

| คำ | ความหมาย |
|---|---|
| **Theme** | ชุดสีของกระดาน + UI (background ของ cell, สีตัวเลข, border) |
| **Background** | พื้นหลังของหน้าเกม (gradient/pattern/photo) |
| **Avatar** | ตัวละครของผู้เล่น แบ่งเป็น slot: face, hat, eyes, body, pet |
| **Item** | ของในร้าน — theme, background, avatar parts |
| **Inventory** | ของที่ผู้เล่นมีอยู่ |
| **Equip** | การเลือก item ที่มีอยู่มาใช้ |

## 🛠️ Technical

| คำ | ความหมาย |
|---|---|
| **Seed** | ตัวเลขใช้ใน random generator เพื่อให้ output เดิม — daily seed = วันที่ |
| **RNG** | Random Number Generator |
| **LCG** | Linear Congruential Generator — RNG แบบที่ใช้อยู่ใน v1 |
| **RLS** | Row Level Security — Postgres feature ที่ Supabase ใช้ควบคุม permission |
| **PWA** | Progressive Web App — เว็บที่ install เป็น app ได้ |
| **Capacitor** | Tool wrap PWA เป็น native iOS/Android app |
| **Edge Function** | Serverless function บน Supabase (Deno) |
| **Realtime** | Supabase feature — sub data changes ผ่าน websocket |
| **Anonymous user** | User ที่ยังไม่ sign up — มี UUID แต่ไม่มี email |

## 📊 Metrics

| คำ | ความหมาย |
|---|---|
| **DAU** | Daily Active User |
| **MAU** | Monthly Active User |
| **D1/D7/D30** | Retention — % ของ user ที่กลับมาในวันที่ 1/7/30 หลัง install |
| **ARPU** | Average Revenue Per User |
| **CPI** | Cost Per Install (ads) |
| **LTV** | Lifetime Value |
| **DAU/MAU ratio** | "Stickiness" — สูง = คนเล่นบ่อย |
