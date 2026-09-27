import { parseReceiptItems } from "../src/composables/useReceiptOcr";

const sample = `
BERKAH AMALIA
RAYA PONOROGO- MADIUN
TERAN GEGER MADIUN
WA TIMUR
NPWP 812557643821000
PAGOTAN MADIUN 0351369493
JL. RAYA PONOROGO NO.542, KEL UTERAN
KEC GEGER, KAB MADIUN, 63171
--------------------------------
2.09.22-15:26/2.2.17/F2QM 9336/ANGGI/02
MOGU MOGU CCONUT 320  2  11300  22600
BABY HAPY PANTS 34/M  1  58500  58500
IN-BEE STICK KEJU60  1  7400  7400
HARGA JUAL : 88,500
C BABY HAPY PANTS 30/L/SAYAP : (10,000)
C BABY HAPY PANTS 30/L/SAYAP : (1,000)
C BABY HAPY PANTS 30/L/SAYAP : (600)
TOTAL : 76,900
TUNAI : 76,900
ANDA HEMAT : 11,600
PPN : DPP= 79,730 PPN= 8,770
LAYANAN KONSUMEN SMS 0811 1500 280
CALL 1500 280 - KONTAK@INDOMARET.CO.ID
MADIUN 63171
`;

const items = parseReceiptItems(sample);
console.log(JSON.stringify(items, null, 2));

const names = items.map((i) => i.name.toLowerCase()).join(" | ");
const leaks = ["63171", "npwp", "pagotan", "sms", "call", "madiun 63171", "wa timur", "f2qm"];
for (const leak of leaks) {
  if (names.includes(leak) || items.some((i) => String(i.price) === leak)) {
    console.error("LEAK:", leak);
    process.exit(1);
  }
}
if (items.length !== 3) {
  console.error("Expected 3 items, got", items.length);
  process.exit(1);
}
if (items[0].price !== 22600 || items[1].price !== 58500 || items[2].price !== 7400) {
  console.error("Unexpected prices", items);
  process.exit(1);
}
console.log("OK");
