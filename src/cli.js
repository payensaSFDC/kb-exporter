const yargs = require("yargs");

module.exports = () =>
  yargs
    .option("username", {
      alias: "u",
      describe: "Salesforce username",
      demandOption: true,
      type: "string",
    })
    .option("password", {
      alias: "p",
      describe: "Salesforce password (+ token if required)",
      demandOption: true,
      type: "string",
    })
    .option("input", {
      alias: "i",
      describe: "Path of the generated CSV with KAV data",
      demandOption: true,
      type: "string",
    })
    .option("output", {
      alias: "o",
      describe: "Destination folder for the package",
      demandOption: true,
      type: "string",
    })
    .option("offset", {
      alias: "s",
      describe: "First row to process (0-based)",
      type: "number",
      default: 0,
    })
    .option("limit", {
      alias: "l",
      describe: "Max rows to process",
      type: "number",
    })
    .option("loginUrl", {
      alias: "r",
      describe: "Salesforce login URL",
      type: "string",
      default: "https://test.salesforce.com",
    })
    .help("h")
    .alias("h", "help").argv;
