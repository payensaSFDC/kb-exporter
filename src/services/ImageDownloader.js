// Depends on an abstraction (SalesforceClient interface) ➜ DIP
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const colors = require("ansi-colors");

class ImageDownloader {
  constructor({ salesforceClient, progress, restApiVersion }) {
    this.sf = salesforceClient;
    this.bar = progress;
    this.api = restApiVersion;
  }

  async download({ eid, refid, fieldName, imgDir }) {
    const url = `${this.sf.instanceUrl()}/services/data/v${this.api}/sobjects/Knowledge__kav/${eid}/richTextImageFields/${fieldName}/${refid}`;
    const fileBase = path.join(imgDir, `${eid}_${refid}`);

    try {
      const { data, headers } = await axios.get(url, {
        responseType: "stream",
        headers: { Authorization: `Bearer ${this.sf.accessToken()}` },
      });

      const ext = (headers["content-type"] || "").split("/")[1] || "jpg";
      const filePath = `${fileBase}.${ext}`;

      await new Promise((res, rej) => {
        const ws = fs.createWriteStream(filePath);
        data.pipe(ws);
        data.on("end", res);
        data.on("error", rej);
      });

      this.bar.increment(1);
      return filePath;
    } catch (err) {
      console.error(
        colors.redBright(`✖  Image download failed (${url}) →`),
        err.message,
      );
      return null;
    }
  }
}

module.exports = ImageDownloader;
