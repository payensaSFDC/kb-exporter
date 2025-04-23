const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

class ZipArchiver {
  static async zipDir({ srcDir, destDir, zipName = "package.zip" }) {
    return new Promise((res, rej) => {
      const outPath = path.join(destDir, zipName);
      const output = fs.createWriteStream(outPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        res({
          outPath: outPath,
          size: archive.pointer(),
        });
      });
      archive.on("error", rej);

      archive.pipe(output);
      archive.glob("**/*", { cwd: srcDir, dot: false });
      archive.finalize();
    });
  }
}

module.exports = ZipArchiver;
