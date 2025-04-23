const fs = require("fs");
const path = require("path");
const CsvStorage = require("./CsvStorage");
const ora = require("ora");
const ZipArchiver = require("./ZipArchiver");

const MiB = 1024 * 1024;

class ArticlePackager {
  constructor({ baseOutputDir, restApiVersion, propertiesFile, maxSizeMb }) {
    this.baseDir = baseOutputDir;
    this.batch = 1;
    this.reset();
    this.restApiVersion = restApiVersion; // for future use
    this.propertiesFile = propertiesFile;
    this.limitBytes = maxSizeMb * MiB;
    this.reset();
  }

  reset() {
    this.rows = [];
    this.files = new Set(); // absolute paths
    this.size = 0;
    this.pkgDir = path.join(this.baseDir, `package_${this.batch}`);
    fs.rmSync(this.pkgDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(this.pkgDir, "img"), { recursive: true });
    fs.mkdirSync(path.join(this.pkgDir, "html"), { recursive: true });
  }

  /** Returns the workspace folders for html/img of the *current* batch */
  currentFolders() {
    return {
      imgDir: path.join(this.pkgDir, "img"),
      htmlDir: path.join(this.pkgDir, "html"),
    };
  }

  /** Adds a processed row plus the list of new files it generated. */
  add(row, relatedFilePaths) {
    const rowSize = Buffer.byteLength(JSON.stringify(row)); // header-only estimate
    const fileSize = relatedFilePaths
      .map((f) => fs.statSync(f).size)
      .reduce((a, b) => a + b, 0);

    const projected = this.size + rowSize + fileSize;
    if (projected > this.limitBytes && this.rows.length) {
      // Flush current batch and start a new one first
      this.flush();
    }

    this.rows.push(row);
    relatedFilePaths.forEach((p) => this.files.add(p));
    this.size += rowSize + fileSize;
  }

  /** Flush current batch: write CSV, copy files, zip, then prepare next batch. */
  flush() {
    if (!this.rows.length) return;

    // 1. copy files into their img/html folders
    for (const abs of this.files) {
      const rel = abs.includes("/img/") ? "img" : "html";
      fs.copyFileSync(abs, path.join(this.pkgDir, rel, path.basename(abs)));
    }
    if (this.propertiesFile && fs.existsSync(this.propertiesFile)) {
      const dest = path.join(this.pkgDir, path.basename(this.propertiesFile));
      fs.copyFileSync(this.propertiesFile, dest);
    }

    // 2. CSV
    const csvPath = path.join(this.pkgDir, "articles.csv");
    CsvStorage.write(csvPath, this.rows);

    // 3. ZIP
    const res = ZipArchiver.zipDir({
      srcDir: this.pkgDir,
      destDir: this.baseDir,
      zipName: `package_${this.batch}.zip`,
    });

    // 4. prepare next batch
    this.batch += 1;
    this.reset();
  }
}

module.exports = ArticlePackager;
