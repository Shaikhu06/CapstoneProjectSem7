// backend/import_csv.js
const fs = require("fs");
const path = require("path");
const {parse} = require("csv-parse");
const db = require("./db");

const FILE = path.join(__dirname, "./data/India-specific_Emission_Factors.csv"); // adjust path

(async () => {
  if (!fs.existsSync(FILE)) {
    console.error("CSV file not found:", FILE);
    process.exit(1);
  }

  const parser = fs.createReadStream(FILE).pipe(parse({ columns: true, trim: true }));
  for await (const row of parser) {
    // row keys expected: Category,Item,Factor,Unit,Source,Year,Notes
    const category =
      row.Category || row.category || row.CategoryName || row.Category_Name;
    const item = row.Item || row.item || row.ItemName || row.Name;
    const factor = row.Factor || row.factor || row.Value;
    const unit = row.Unit || row.unit || row.StandardUnit || "";
    const source = row.Source || row.source || "";
    const year = row.Year ? parseInt(row.Year) : null;
    const notes = row.Notes || row.notes || "";

    if (!category || !item || !factor) {
      console.warn("Skipping incomplete row", row);
      continue;
    }

    try {
      await db.query(
        `INSERT INTO emission_factors (category,item,factor,unit,source,year,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [category, item, factor, unit, source, year, notes]
      );
    } catch (e) {
      console.error("Insert error", e.message);
    }
  }

  console.log("CSV import finished.");
  process.exit(0);
})();