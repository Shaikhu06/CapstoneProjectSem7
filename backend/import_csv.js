/**
 * import_csv_allow_nulls.js
 * - tailored for your IPCC-style CSV
 * - inserts rows even when factor is missing (factor -> NULL)
 * - writes skipped rows (if any critical DB error) to skipped_rows.json
 */

const fs = require("fs");
const path = require("path");
const {parse} = require("csv-parse");
const db = require("./db");

const FILE = path.join(__dirname, "./data/India-specific_Emission_Factors.csv");
const SKIPPED_OUT = path.join(__dirname, "data", "skipped_rows.json");

if (!fs.existsSync(FILE)) {
  console.error("CSV not found at", FILE);
  process.exit(1);
}

function parseNumber(val) {
  if (val === undefined || val === null) return null;
  let s = String(val).trim();
  if (s === "") return null;
  // remove commas in numbers like "1,234.56"
  s = s.replace(/,/g, "");
  // extract first numeric token (handles scientific)
  const m = s.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/);
  if (!m) return null;
  const parsed = parseFloat(m[0]);
  if (!isFinite(parsed)) return null;
  // convert gCO2 -> kgCO2 if unit present in string
  if (/g ?co2/i.test(s)) return parsed / 1000.0;
  return parsed;
}

(async () => {
  console.log("Importing emission factors from:", FILE);
  const parser = fs
    .createReadStream(FILE)
    .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }));

  let inserted = 0,
    skipped = 0;
  const skippedRows = [];
  const sampleInserted = [];

  for await (const row of parser) {
    try {
      // Map IPCC-like fields
      const category = (
        row["category_ipcc_2006"] ||
        row["category_ipcc_1996"] ||
        row["category"] ||
        ""
      ).trim();
      const item = (
        row["description"] ||
        row["activity_description"] ||
        row["Item"] ||
        row["description_text"] ||
        ""
      ).trim();
      // prefer canonical value, fallback to original
      const rawFactorVal =
        row["value_canonical"] || row["value_original"] || row["Value"] || "";
      const parsedFactor = parseNumber(rawFactorVal); // may be null
      const unit = (
        row["unit_canonical"] ||
        row["unit_original"] ||
        row["unit"] ||
        ""
      ).trim();
      const source = (
        row["source_of_data"] ||
        row["data_provider"] ||
        row["Source"] ||
        ""
      ).trim();
      const notesExtra = `gas=${row["gas"] || ""}; region=${
        row["region"] || ""
      }; equation=${row["equation"] || ""}; tech_ref=${
        row["technical_reference"] || ""
      }`;

      // If item missing, fallback to category or gas or skip
      const finalItem = item || (row["gas"] || "").trim() || "Unknown activity";

      // If both item and category are blank, skip
      if (!category && finalItem === "Unknown activity") {
        skipped++;
        skippedRows.push({ reason: "no category and no item", raw: row });
        continue;
      }

      // Insert, allow factor to be NULL
      await db.query(
        `INSERT INTO emission_factors (category, item, factor, unit, source, notes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          category || "Uncategorized",
          finalItem,
          parsedFactor, // may be null
          unit || "",
          source || "IPCC",
          (row["value_original"]
            ? `orig_value=${row["value_original"]}; `
            : "") + notesExtra,
        ]
      );

      inserted++;
      if (sampleInserted.length < 5)
        sampleInserted.push({
          category,
          item: finalItem,
          factor: parsedFactor,
          unit,
          source,
        });
    } catch (err) {
      skipped++;
      skippedRows.push({ reason: "db error", msg: err.message, raw: row });
    }
  }

  console.log("Import finished. inserted=", inserted, "skipped=", skipped);
  if (sampleInserted.length) console.log("Sample inserted:", sampleInserted);
  if (skippedRows.length) {
    console.warn("Some rows skipped (first 10):", skippedRows.slice(0, 10));
    fs.writeFileSync(SKIPPED_OUT, JSON.stringify(skippedRows, null, 2));
    console.log("Wrote skipped rows to", SKIPPED_OUT);
  }

  process.exit(0);
})();
