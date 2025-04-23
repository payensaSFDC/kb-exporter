// Pure configuration holder, injected where needed
const path = require("path");
const cfg = require("../config.json");

module.exports = {
  packageFolder: path.resolve(__dirname, "..", cfg.packageFolder),
  propertiesFile: path.resolve(__dirname, "..", cfg.propertiesFile),
  restApiVersion: cfg.restApiVersion || "63.0",
  recordTypeMapping: cfg.recordTypeMapping || {},
};
