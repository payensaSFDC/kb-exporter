/* Orchestrator that wires everything together.
   It obeys the Law of Demeter: each unit talks only to its friends. */
const path = require("path");
const fs = require("fs");
const ora = require("ora");
const colors = require("ansi-colors");

const parseCli = require("./cli");
const config = require("./config");
const ArticlePackager = require("./services/ArticlePackager");
const SalesforceClient = require("./services/SalesforceClient");
const CsvStorage = require("./services/CsvStorage");
const ImageDownloader = require("./services/ImageDownloader");
const HtmlTransformer = require("./services/HtmlTransformer");
const ZipArchiver = require("./services/ZipArchiver");
const ProgressBars = require("./services/ProgressBars");

(async () => {
  const t0 = Date.now();
  const args = parseCli();

  // 1 · Salesforce login
  let spinner = ora("Conecting to Salesforce...").start();
  const sf = new SalesforceClient(args);
  await sf.login();
  spinner.succeed("Connected to Salesforce");

  // 2 · Detect Knowledge object
  const { sobjects } = await sf.conn.describeGlobal();
  const kavObj = sobjects.find((s) => s.name.endsWith("__kav"));
  if (!kavObj) {
    console.error(colors.redBright("✖  No Knowledge objects found."));
    process.exit(1);
  }

  // 3 · Fetch all KAV rows → CSV
  const fields = await sf.listImportableFields(kavObj.name);
  const soql = `SELECT ${fields.map((f) => f.name).join(",")} FROM ${kavObj.name} ORDER BY CreatedDate ASC`;

  spinner = ora("Executing query…").start();
  const { records } = await sf.queryAll(soql);

  CsvStorage.write(args.input, records);
  spinner.succeed(`${records.length} articles saved to ${args.input}`);

  // 4 · Prepare package structure
  if (path.resolve(config.packageFolder) === path.resolve(args.output)) {
    console.error(
      colors.redBright("✖  Output folder must differ from packageFolder."),
    );
    process.exit(1);
  }
  fs.rmSync(config.packageFolder, { recursive: true, force: true });
  const packager = new ArticlePackager({
    baseOutputDir: args.output,
    restApiVersion: config.restApiVersion,
    propertiesFile: config.propertiesFile,
    maxSizeMb: args.maxSizeMb,
  });

  // 5 · Process CSV rows (HTML + images)
  const rows = await CsvStorage.read({
    filePath: args.input,
    offset: args.offset,
    limit: args.limit,
  });

  const bars = new ProgressBars(rows.length);
  const imgDl = new ImageDownloader({
    salesforceClient: sf,
    progress: bars.download,
    restApiVersion: config.restApiVersion,
  });

  const richFields = fields.filter(
    (f) =>
      ["richtextarea"].includes((f.extraTypeInfo || "").toLowerCase()) &&
      f.custom,
  );
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const { imgDir, htmlDir } = packager.currentFolders();
    const htmlXf = new HtmlTransformer({
      imgDownloader: imgDl,
      htmlDir,
      imgDir,
      downloadBar: bars.download,
    });

    if (row.RecordTypeId && config.recordTypeMapping[row.RecordTypeId]) {
      row.RecordTypeId = config.recordTypeMapping[row.RecordTypeId];
    }

    const generatedFiles = []; // track all files generated for this row
    for (const f of richFields) {
      const files =
        (await htmlXf.transform(row, f.name, i + args.offset)) || [];
      generatedFiles.push(...files); // HtmlTransformer should now return array of paths
    }
    packager.add(row, generatedFiles);
    bars.rows.increment();
  }
  packager.flush();
  bars.stop();

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(colors.greenBright(`🏁  Finished in ${secs}s`));
})();
