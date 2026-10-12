import XLSX from "xlsx";

const wb = XLSX.readFile("c:/Users/hussain/Downloads/PRODUCT LIST_CI_JIS SERIES.xlsx");
const rows = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1, { header: 1, defval: "" });
const data = rows.slice(1).filter((r) => r[1]);

let update = 0;
let numeric = 0;
for (const r of data) {
  const p = String(r[4] ?? "").trim();
  if (/update|inquir|request|tbd/i.test(p)) update += 1;
  else if (Number(String(p).replace(/[^0-9.]/g, ""))) numeric += 1;
}
console.log("rows", data.length, "update-ish", update, "numeric", numeric);

const types = {};
for (const r of data) {
  const d = String(r[1]).toUpperCase();
  let t = "OTHER";
  if (d.includes("GATE VALVE")) t = "GATE";
  else if (d.includes("GLOBE VALVE")) t = "GLOBE";
  else if (d.includes("ANGLE VALVE")) t = "ANGLE";
  else if (d.includes("CHECK") || d.includes("STORM")) t = "STORM";
  else if (d.includes("HOSE")) t = "HOSE";
  types[t] = (types[t] || 0) + 1;
}
console.log("types", types);

function stripSize(desc) {
  return String(desc)
    .trim()
    .replace(/\s+\d+\s*MM\s*$/i, "")
    .replace(/\s+\d+(?:-\d+\/\d+|\d+\/\d+)?\s*(?:\"|IN)?\s*$/i, "")
    .trim();
}

const groups = new Map();
for (const r of data) {
  const tech = String(r[2] ?? "").trim();
  const base = stripSize(r[1]);
  const key = `${base}::${tech}`;
  if (!groups.has(key)) groups.set(key, { name: base, tech, count: 0 });
  groups.get(key).count += 1;
}
console.log("product groups", groups.size);
