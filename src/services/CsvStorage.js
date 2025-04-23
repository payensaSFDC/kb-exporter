// Handles ONLY CSV I/O (open/closed for other formats) ➜ OCP
const fs = require("fs");
const path = require("path");
const csvParse = require("csv-parser");

class CsvStorage {
  static write(filePath, rows) {
    if (!rows.length) return;
    const header = Object.keys(rows[0]).join(",");
    const body = rows
      .map((r) =>
        Object.values(r)
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    fs.writeFileSync(filePath, `${header}\n${body}`);
  }

  static read({ filePath, offset = 0, limit }) {
    return new Promise((resolve) => {
      const rows = [];
      let idx = 0;
      fs.createReadStream(filePath)
        .pipe(csvParse())
        .on("data", (row) => {
          if (idx++ < offset) return;
          if (limit && rows.length >= limit) return;
          rows.push(row);
        })
        .on("end", () => resolve(rows));
    });
  }

  static duplicateToPackage(srcPath, packageFolder) {
    const dest = path.join(packageFolder, path.basename(srcPath));
    fs.copyFileSync(srcPath, dest);
  }
}

module.exports = CsvStorage;
