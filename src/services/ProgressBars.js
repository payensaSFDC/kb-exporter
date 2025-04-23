// Progress UI isolated from business logic
const cliProgress = require("cli-progress");
const colors = require("ansi-colors");

class ProgressBars {
  constructor(totalRows) {
    this.multi = new cliProgress.MultiBar(
      {
        clearOnComplete: false,
        hideCursor: true,
        format:
          "{task} |" +
          colors.cyanBright("{bar}") +
          "| {percentage}% | {value}/{total}",
      },
      cliProgress.Presets.rect,
    );

    this.rows = this.multi.create(totalRows, 0, { task: "Articles" });
    this.download = this.multi.create(1, 0, { task: "Images" });
  }

  stop() {
    this.multi.stop();
  }
}

module.exports = ProgressBars;
