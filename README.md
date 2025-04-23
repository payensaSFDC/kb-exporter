# Salesforce Knowledge‑Base Exporter (Experimental)

> **Status : experimental 🚀 – breaking changes may occur at any time.**

A CLI tool that bulk‑exports Salesforce **Knowledge** articles, rewrites embedded HTML so that images point to local files, and bundles everything into a ready‑to‑import ZIP package.

The codebase is a practical demonstration of the **SOLID principles** in Node.js.

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Quick Start](#quick-start)
6. [Configuration](#configuration)
7. [How It Works](#how-it-works)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features

- Logs in to a Salesforce org (Production or Sandbox) via **jsforce**.
- Discovers Knowledge objects automatically (both Classic & Lightning).
- Streams articles (> 10 k rows supported) and writes them to CSV.
- Downloads every rich‑text image and rewrites HTML accordingly.
- Generates as many archives as necessary, each ≤ --max-size-mb MiB (default 10). No article appears in more than one ZIP.
- Every `package_<n>.zip` contains:
  - `/img` – all binary assets.
  - `/html` – transformed article bodies.
  - `articles.csv` – the updated CSV ready for re‑import.
  - `knowledge.properties` – properties file.
- Progress bars, colored logging, and spinner feedback.
- Clean, testable design: each service has a single responsibility.

## Project Structure

```text
kb-export/
├── src/
│   ├── cli.js            # Command‑line interface (yargs)
│   ├── config.js         # Centralised configuration wrapper
│   ├── services/         # Independent, injectable modules
│   │   ├── SalesforceClient.js
│   │   ├── CsvStorage.js
│   │   ├── ImageDownloader.js
│   │   ├── HtmlTransformer.js
│   │   ├── ZipArchiver.js
│   │   └── ProgressBars.js
│   └── main.js           # Orchestrator / entry point
├── config.json           # Runtime parameters (see below)
└── package.json
```

## Prerequisites

- **Node.js 18 LTS** or newer
- A Salesforce user with API access (username + password + token)
- Git (to clone the repository)

## Installation

```bash
# 1. Clone
$ git clone https://github.com/payensaSFDC/kb-export.git
$ cd kb-export

# 2. Install dependencies
$ npm ci            # or npm install

# 3. Rename & edit the sample config if needed
$ cp config.example.json config.json
```

## Quick Start

```bash
node src/main.js \
  --username "my.user@example.com" \
  --password "SuperSecretPwdSECURITYTOKEN" \
  --input    "articles.csv"             \
  --output   "./dist"                  \
  --loginUrl "https://test.salesforce.com"
  --max-size-mb 10 # optional (default 10)
```

The script will:

1. Query all Knowledge articles, writing them to `articles.csv`.
2. Process the CSV, downloading images to `dist/package/img` and rewriting HTML.
3. Split results into package_1.zip, package_2.zip, … inside ./dist/, each ≤ 10 MiB.

## Configuration

`config.json` keys you may want to tweak:

| Key              | Description                                    |
| ---------------- | ---------------------------------------------- |
| `packageFolder`  | Temporary workspace, deleted on every run.      |
| `propertiesFile` | XML template copied into the package.           |
| `recordTypeMapping` | Map old → new RecordTypeIds during rewrite. |
| `restApiVersion` | Salesforce REST version (e.g. `v64.0`).        |

## How It Works

1. **Login** – `SalesforceClient` authenticates and keeps the session.
2. **Discover** – queries `describeGlobal` to find the `__kav` object.
3. **Bulk Fetch** – streams records and writes raw CSV.
4. **Transform** – `HtmlTransformer` loads each rich‑text field with **cheerio**, delegates image download to `ImageDownloader`, rewrites `<img src>` paths, and persists HTML to `/html`.
5. **Package** – `ArticlePackager` groups rows and assets until the next file would exceed the cap, then flushes a ZIP via ZipArchiver.
5. **Repeat** – steps 4‑5 continue until all rows processed.

## Contributing

Pull requests are welcome – please read `CONTRIBUTING.md` (TBD) before submitting.  
Issues and feature requests can be opened in the tracker.

### Development tasks

```bash
# Lint & test
npm run lint:fix
npm test
npm run format
```

## References

- [Salesforce Knowledge Article Importer](https://help.salesforce.com/s/articleView?id=service.knowledge_article_importer_04zip.htm&type=5)
- [Salesforce REST API: Retrieve Rich Text Images](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_sobject_rich_text_image_retrieve.htm)

## Notes

- Ensure the Salesforce credentials provided have sufficient permissions to access the Knowledge Article data and retrieve images.
- Column names in the CSV that Salesforce will import are case-sensitive.

## License

This project is released under the **MIT License** – a permissive and widely‑used license perfect for small utilities and developer tools.  
See [LICENSE](LICENSE) for the full text.
