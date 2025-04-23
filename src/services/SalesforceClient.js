const jsforce = require("jsforce");
const colors = require("ansi-colors");

class SalesforceClient {
  constructor({ username, password, loginUrl }) {
    this.username = username;
    this.password = password;
    this.loginUrl = loginUrl;
    this.conn = new jsforce.Connection({ loginUrl });
  }

  async login() {
    try {
      await this.conn.login(this.username, this.password);
    } catch (err) {
      console.error(
        colors.redBright("✖  Salesforce login failed →"),
        err.message,
      );
      process.exit(1);
    }
  }

  accessToken() {
    return this.conn.accessToken;
  }
  instanceUrl() {
    return this.conn.instanceUrl;
  }

  async queryAll(soql, max = 10_000) {
    const res = await this.conn
      .query(soql)
      .execute({ autoFetch: true, maxFetch: max });
    res.records = res.records.map(({ attributes, ...rest }) => rest);
    return res;
  }

  async listImportableFields(apiName) {
    const sysReadOnly = new Set([
      "Id",
      "ArticleNumber",
      "PublishStatus",
      "VersionNumber",
      "IsLatestVersion",
      "CreatedDate",
      "LastModifiedDate",
      "OwnerId",
      "IsDeleted",
      "IsVisibleInPkb",
      "IsVisibleInCsp",
      "IsVisibleInPrm",
    ]);
    const desc = await this.conn.sobject(apiName).describe();
    return desc.fields.filter((f) => f.createable && !sysReadOnly.has(f.name));
  }
}

module.exports = SalesforceClient;
