const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// Transforms HTML content & resolves embedded images
class HtmlTransformer {
  constructor({ imgDownloader, htmlDir, imgDir, downloadBar }) {
    this.imgDownloader = imgDownloader;
    this.htmlDir = htmlDir; // where transformed .html files go
    this.imgDir = imgDir; // where images must be stored
    this.downloadBar = downloadBar;
  }

  async transform(row, fieldName, rowIdx) {
    const html = row[fieldName];
    if (!html) return;

    const $ = cheerio.load(html);
    const imgs = $("img");
    this.downloadBar.setTotal(imgs.length);
    this.downloadBar.update(0);

    const downloadedFilePaths = [];

    for (const el of imgs) {
      const imgUrl = $(el).attr("src");
      if (!imgUrl) continue;

      const { searchParams } = new URL(decodeURIComponent(imgUrl));
      const eid = searchParams.get("eid");
      const refid = searchParams.get("refid");
      if (!eid || !refid) continue;

      const localPath = await this.imgDownloader.download({
        eid,
        refid,
        fieldName,
        imgDir: this.imgDir,
      });

      if (localPath) {
        $(el).attr("src", path.relative(this.htmlDir, localPath));
        if (fs.existsSync(localPath)) downloadedFilePaths.push(localPath);
      }
    }

    const htmlFile = `kb_${rowIdx}_${fieldName}.html`;
    const htmlPath = path.join(this.htmlDir, htmlFile);
    fs.writeFileSync(htmlPath, $.html({ decodeEntities: false }));
    row[fieldName] = path.join("html", htmlFile);
    return [htmlPath, ...downloadedFilePaths];
  }
}

module.exports = HtmlTransformer;
