// backend/import_csv.js
const fs = require("fs");
const parse = require("csv-parse");
const db = require("./db");

const file = "../India-specific_Emission_Factors.csv"; // adjust path

fs.createReadStream(file)
  .pipe(parse({ columns: true, trim: true }))
  .on("data", async (row) => {
    const { Category, Item, Factor, Unit, Source, Year, Notes } = row;
    try {
      await db.query(
        `INSERT INTO emission_factors(category,item,factor,unit,source,year,notes)
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [Category, Item, Factor, Unit, Source, Year, Notes]
      );
    } catch (e) {
      console.error("insert error", e);
    }
  })
  .on("end", () => {
    console.log("CSV import done");
    process.exit();
  });
