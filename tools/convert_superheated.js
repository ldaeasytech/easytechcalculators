import XLSX from "xlsx";
import fs from "fs";

const wb = XLSX.readFile("Superheated_properties.xlsx");
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { raw: true });

fs.writeFileSync(
  "src/data/superheated_table.json",
  JSON.stringify(rows, null, 2)
);

console.log("✔ Superheated table converted to JSON");
