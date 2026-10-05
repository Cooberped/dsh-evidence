<div align="center">

[English](README.md) | [简体中文](README.zh.md)

</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/Cooberped/dsh-evidence/main/assets/readme/hero.svg" width="100%" alt="dsh-evidence turns local files into versioned evidence through upload, retrieval, coordinate reads, and native vision.">
</p>

# dsh-evidence

**Attach files in DeepSeek Harness and let the model actually read them.**

Upload files or a whole folder from the Web composer. Parsing and indexing stay on your machine. The model searches for compact evidence and expands only the exact page, slide, line range or spreadsheet range it needs — instead of pasting whole documents into the prompt or shelling out to Python. Raster images stay on Harness' native vision path.

> [!IMPORTANT]
> **Public npm beta.** Install [`@baseland/dsh-evidence@beta`](https://www.npmjs.com/package/@baseland/dsh-evidence). The published build is [`0.6.0-beta.3`](https://github.com/Cooberped/dsh-evidence/releases/tag/v0.6.0-beta.3). Prefer `@beta` for this pre-release. `latest` still names the first published version, `0.6.0-beta.1`, because this prerelease does not move it. That is not a stable release.
>
> The GitHub repository stays at [Cooberped/dsh-evidence](https://github.com/Cooberped/dsh-evidence). The npm package is `@baseland/dsh-evidence` because the npm organization `@cooberped` could not be claimed.

## How it works

1. **Upload once** into the active session workspace.
2. **Index locally** — no full document enters the model context.
3. **Retrieve compact evidence** for a concrete question.
4. **Expand a versioned coordinate** only when more context is needed.
5. **Answer from evidence**, or say the evidence was not found.

That way, a file becomes evidence you can locate and read back on demand, instead of pasting the whole document into the prompt.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cooberped/dsh-evidence/main/assets/readme/architecture.svg" width="100%" alt="dsh-evidence architecture: composer, local ingest, private retrieval, model tools, and native vision branch.">
</p>

## Install

You need the DeepSeek Harness CLI with the `web` profile (currently tested against npm `@deepseek-ai/dsh@0.1.7-rc.2`) and Node.js `>=22.13.0`. A source install also needs `pnpm` on `PATH`.

DeepSeek Harness 0.1.7 or higher is required. The current code uses the `…Regular` icon names and pins the `@deepseek-ai/dsh-*` peer dependencies at `0.1.7-rc.2`. On 0.1.6 and earlier, the upload icons do not match, and neither do the peer dependencies. This repository has no release tag for the older versions; if you still need to run ≤ 0.1.6, use the code from before that change, or upstream [`taxueseek/dsh-files`](https://github.com/taxueseek/dsh-files).

### From npm

```sh
dsh plugin --profile web add @baseland/dsh-evidence@beta
dsh --profile web --dump-config     # confirm the bundle layer is present
dsh web                             # restart
```

Prefer `@beta`. It names this pre-release, `0.6.0-beta.3`. A bare `@baseland/dsh-evidence` follows `latest`, which still names `0.6.0-beta.1`. That was the first version on npm. The registry keeps a `latest` tag, and publishing this beta with the `beta` tag does not move it. When a stable version is published, `latest` should move to it. `@beta` keeps tracking the pre-release.

Release notes: [v0.6.0-beta.3](https://github.com/Cooberped/dsh-evidence/releases/tag/v0.6.0-beta.3). That is the build `@beta` installs. Runtime behavior is unchanged from `0.6.0-beta.2`. It still includes the upload fixes that were not in `0.6.0-beta.1`: chips for the second and later files in a batch land in the right place, a long Chinese text file is still recognized when the first slice ends in the middle of a character, and a confirmed text card shows its own short extension (`.md` as `MD`) instead of `TXT`. This beta only picks up the devDependency lockfile bump of `@types/node` from 26.6.2 to 26.6.3, and the transitive `ws` lockfile change that came with it.

`dsh plugin add` forwards the rest of the command to pnpm inside the profile, which is the install path in the [Harness bundle publishing guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md). If your npm client uses a China mirror (for example npmmirror) and the package is missing, point this one command at the public registry:

```sh
dsh plugin --profile web add @baseland/dsh-evidence@beta --registry https://registry.npmjs.org/
```

Remove it with `dsh plugin --profile web remove @baseland/dsh-evidence`.

Profile and plugin setup follows the official [Harness plugin reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md) and the same publishing guide.

### From source

```sh
git clone https://github.com/Cooberped/dsh-evidence.git
cd dsh-evidence
pnpm install --frozen-lockfile
pnpm build

dsh plugin --profile web add .      # link this checkout into the web profile
dsh --profile web --dump-config     # confirm the bundle layer is present
dsh web                             # restart
```

The install is a link to this checkout: after pulling updates, re-run `pnpm install --frozen-lockfile && pnpm build` and restart. Remove it with `dsh plugin --profile web remove @baseland/dsh-evidence`.

## Use it

1. Open the Harness Web composer.
2. Add files: paperclip for multi-select, the folder button for a directory, or drop anything on the page.
3. Check that every intended file has its own card showing `AI-readable`.
4. Ask a concrete question — the model calls the tools on its own.

Prompts that work well:

```text
Index these three files first. Do not summarize them yet.
```

```text
Across these files, find the definition and formula for the Q3 retention metric.
Give the source file and exact page, slide, line range, or Sheet!Range for every claim.
```

```text
Compare the meeting decision with the workbook target.
If the documents do not contain enough evidence, say what is missing instead of guessing.
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Cooberped/dsh-evidence/main/assets/readme/evidence-loop.svg" width="100%" alt="Recommended model evidence loop: inventory, retrieve, expand, and answer from version-checked evidence.">
</p>

## The two tools

| | `search_documents` | `read_document` |
| --- | --- | --- |
| Use it to | find **where** the answer is | read **what** is at a place |
| Key inputs | `file_paths`, optional short `query` | `file_path` + `coordinate`/`version`, or `offset`/`limit`, or `sheet`/`cell_range`/`list_sheets` |
| No `query` | indexes changed content and returns a compact inventory — good for "read these first" | — |
| Returns | ranked evidence blocks, each with `path`, `format`, `text`, `coordinate` and `version` | a paged window of the document, or one coordinate expanded exactly |

Two rules hold the loop together:

- **Coordinates carry a version** (source hash + parser/block schema). Supplying a `coordinate` makes `version` mandatory, and it is checked before any content is returned. Edit the file and the old coordinate fails loudly instead of quietly reading the wrong lines.
- **Zero recall is not permission to guess.** The tool tells the model to retry with different terms, read sequentially when justified, or report that the files contain no evidence.

## Formats and honest boundaries

| Input | Text extracted locally | Stable coordinate | Current boundary |
| --- | --- | --- | --- |
| Text | UTF-8, UTF-16 BOM, high-confidence BOM-less UTF-16, GB18030 | `line:S-E`, optional `chars:S-E` | Other encodings and binary files are rejected |
| PDF | Text-layer extraction, page-preserving | `page:N`, optional local line/character range | No OCR for scanned or image-only pages |
| DOCX | Body, paragraphs, tables, headers, footers, footnotes, endnotes | `line:S-E`, optional `chars:S-E` | No image OCR; not a pixel-faithful Word renderer |
| XLSX | Sheet inventory, cell values, ranges, row/column coordinates | quoted `Sheet!A1:F40` | No formula calculation, chart/shape interpretation, or macro execution |
| PPTX | Slide-order DrawingML text and speaker notes | `slide:N`, optional local line/character range | No slide-image OCR, chart data, SmartArt, animation, or embedded objects |
| JPEG/PNG/WebP/GIF | Native Harness image attachment | Harness attachment identity | Needs a vision-capable model; not parsed by `read_document` |

The format is decided from the bytes, never the extension — an executable renamed to `.pdf` is rejected. Long output is paged and character-bounded, and every truncation is visible.

<details>
<summary><b>Capability details</b> — composer, retrieval, reads, vision handoff</summary>

**Composer and upload**

- Paperclip multi-select, whole-folder selection, and page-level drag and drop.
- Finder multi-selection merges `DataTransfer.items` and `DataTransfer.files`, so a mixed batch is not silently reduced to the first recognized file.
- Documents are captured before Harness' image-only drop handler; pure JPEG/PNG/WebP/GIF drops stay on the native image path.
- Bounded parallel uploads (default `4`); one failure does not cancel the batch.
- Byte-sniffed file cards with `uploading` / `AI-readable` / `failed` states.
- `@` candidates cover uploaded *and* workspace files, and are shown as workspace-relative paths rather than host absolute paths.
- Per-session quota, SHA-256 dedup, TTL cleanup, safe file-name normalization, recursive folder cleanup.

**Local retrieval**

- CJK runs are indexed as overlapping bigrams and queried as phrases, so `流程绩效` does not match a block containing only `绩效流程`. Single characters use a bounded substring fallback; ASCII tokens such as `Q3` stay whole.
- SQLite FTS5 is used only after a startup capability probe succeeds; otherwise the JS memory backend is selected explicitly and the tool result says so.
- Query persistence is off by default.

**Exact document reads**

- XLSX supports workbook inventory, one-based sheet selection, coordinate-preserving A1 ranges, merged headers, hidden/sparse sheets, and explicit detected-value counts.
- PPTX follows presentation relationship order, not ZIP filename order.
- The system prompt tells the model to use these tools first and fall back to Python/shell only after an explicit error or unsupported-feature notice.

**Native vision handoff**

- JPEG/PNG/WebP/GIF use Harness' native composer attachment rail and the provider-neutral base64 `image_url` path.
- The selected model must still declare image input support; this plugin does not make a text-only model visual.

</details>

## Configuration

The bundle ships conservative defaults in [`cordis.patch.yml`](cordis.patch.yml). Harness applies user profile overlays after bundle layers, so inspect the composed result before boot:

```sh
dsh --profile web --dump-config
```

| Setting | Default | Meaning |
| --- | ---: | --- |
| `maxFileBytes` | 24 MiB | Maximum bytes for one document read |
| `uploadMaxBytes` | 24 MiB | Maximum bytes for one upload body |
| `maxUploadBytesPerSession` | 512 MiB | Session upload quota; `0` explicitly disables it |
| `readLimit` | 2,000 in the bundled patch; schema fallback 800 | Maximum lines returned by one `read_document` call |
| `maxOutputChars` | 24,000 | Base character window; narrative formats get smaller format-specific windows |
| `maxConcurrentUploads` | 4 | Admitted upload bodies |
| `uploadTtlMs` | 7 days | Uploaded-file retention |
| `retrievalEnabled` | `true` | Enables `search_documents`; `read_document` remains available when false |
| `retrievalMaxFiles` / `retrievalMaxResults` | 12 / 12 | Files per search call / evidence blocks returned |
| `retrievalQueryLogEnabled` | `false` | Persist normalized model queries for local tuning |
| `trustedHosts` | `[]` | Additional reverse-proxy authorities; empty means loopback only |

Less common settings and their authoritative defaults live in [`src/index.ts`](src/index.ts). An explicit `retrievalIndexDir` must be an absolute private path; `~` is not expanded.

**Runtime backend.** The package requires Node.js `>=22.13.0` (what `pdfjs-dist` requires), and Node 20 reached end of life on 2026-04-30. A persistent retrieval index also needs the runtime to provide `node:sqlite` with FTS5 compiled in. When the startup probe finds either missing, the complete but process-local JS backend takes over. The fallback is supported and reported in tool output.

## Security and privacy

- **Format from file bytes, not the extension.** Extensions are hints only. PDF headers and OOXML ZIP members decide the parser; known foreign binaries and spoofed files are rejected.
- **Bounded OOXML.** ZIP member count and name length, declared XML sizes, aggregate XML expansion, workbook rows/cells and sparse-sheet dimensions are all capped before parser allocation.
- **Workspace containment.** Reads go through `ctx.fs`; when a session cwd exists, the target must stay inside the active session workspace.
- **Safe upload storage.** Pre-existing symlinks and special files are rejected; creation uses exclusive/no-follow flags where supported; quotas and deletion fail closed.
- **Loopback by default.** Upload and workspace endpoints require a loopback host and same-origin checks. `trustedHosts` exists only for a deployment-controlled reverse proxy.

> `trustedHosts` is **not authentication.** The current Harness WebServer plugin conventions cannot prove that a supplied session ID belongs to the caller. Do not expose this plugin as an unauthenticated public multi-tenant upload service. Use loopback-only self-hosting, or an authenticated proxy that also constrains session access.

<details>
<summary><b>Where data lives, and what leaves the machine</b></summary>

| Store | Default | Contains | Lifecycle |
| --- | --- | --- | --- |
| Uploads | `<session-workspace>/.dsh-filess/<storageKey>/` | Uploaded file bytes | Per-session quota, SHA-256 dedup, default 7-day TTL sweep |
| Retrieval index | `$DSH_HOME/dsh-files/index` | Index contents for search, coordinates, versions; queries only when explicitly enabled | Private permissions, document/query TTL, JS memory fallback when persistence is unavailable |

- Parsing and indexing are local to the Harness host; the plugin makes no external parsing request of its own.
- The evidence a tool returns **does** enter the conversation and may be sent to your configured model provider. Native image attachments are also sent to the selected vision provider.
- Do not sync the retrieval directory to cloud storage, and do not commit it to Git.

</details>

<details>
<summary><b>Known limits</b> — what this deliberately does not do</summary>

- Scanned PDFs and images embedded in office files are not OCR'd.
- Office layout is turned into text and coordinates, not rendered pixel-for-pixel.
- XLSX formulas are not calculated and macros never execute.
- PPTX charts, SmartArt, animations and embedded objects are not interpreted.
- Upload quota locking is process-local, not a cross-process transaction.
- Portable Node exposes no complete dirfd/openat chain, so a hostile same-UID process racing ancestor replacement remains an OS-isolation boundary.
- Only Harness versions that have already been tested are covered. A newer version is not guaranteed until it is tested the same way.

</details>

## Project status

| | |
| --- | --- |
| Project | Public source beta, independently maintained by Cooberped |
| Currently tested against | npm `@deepseek-ai/dsh@0.1.7-rc.2` with the `web` profile |
| Minimum version | **0.1.7 or higher.** On 0.1.6 and earlier, the upload icons do not match, and neither do the peer dependencies. To run an older Harness, use the code from before that change, or upstream [`taxueseek/dsh-files`](https://github.com/taxueseek/dsh-files). There is no release tag for those older versions |
| Tested with | OpenCode Go — DeepSeek V4 Flash |
| npm | **Public beta** [`@baseland/dsh-evidence@0.6.0-beta.3`](https://www.npmjs.com/package/@baseland/dsh-evidence/v/0.6.0-beta.3) ([GitHub pre-release v0.6.0-beta.3](https://github.com/Cooberped/dsh-evidence/releases/tag/v0.6.0-beta.3)). Install with `@beta`. `latest` stays on `0.6.0-beta.1`, the first version npm published; this prerelease does not move it, and that is not a stable release. GitHub remains Cooberped. The npm scope is `baseland` because the organization `@cooberped` could not be claimed |
| Compatibility | Newer Harness source versions have not been tested separately, so compatibility is not guaranteed yet |

This is **not an official DeepSeek plugin** and is not affiliated with or endorsed by DeepSeek.

### Relationship to dsh-files

This repository retains the MIT-licensed git history of [`taxueseek/dsh-files`](https://github.com/taxueseek/dsh-files), including attribution and the MIT notice, and is maintained independently (it has left the GitHub fork network). It is not a clean-room rewrite.

Do not install `dsh-files` and `@baseland/dsh-evidence` in the same profile. Both register the cordis row id `files-toolkit`.

Beyond upstream upload and `read_document`, this repository adds local private retrieval (`search_documents`), version-checked coordinates, stronger upload/path/OOXML bounds, PPTX text and speaker notes, CJK-aware retrieval, and community release and governance.

## Development

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm benchmark:retrieval
pnpm license:check
pnpm package:check

pnpm release:check   # everything above, for a final candidate
```

`release:check` covers type checking, both bundles, focused regression tests, dual-backend retrieval correctness, license policy, and the package publish requirements. The benchmark uses deterministic synthetic PDF/DOCX/XLSX/PPTX fixtures — real business documents, answer sets and model outputs stay outside the repository (see [`benchmark/README.md`](benchmark/README.md)).

## Contributing

Issues and pull requests are welcome. Contributions are **reviewed and merged by maintainers after required checks**; GitHub does not merge community code automatically.

Fixes for Harness UI, peer, or upstream API breakage are especially welcome — the 0.1.7 icon rename to `…Regular` names is one example. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

Before opening a PR: read [`CONTRIBUTING.md`](CONTRIBUTING.md) and sign off commits for DCO; add focused tests for behavior changes; run the smallest relevant checks locally; keep real documents, credentials, private paths and model outputs out of Git; and record every new visual asset in [`assets/README.md`](assets/README.md).

Security reports follow [`SECURITY.md`](SECURITY.md). Release ownership and provenance checks are described in [`RELEASING.md`](RELEASING.md).

## License, lineage and marks

Project code and the original SVG documentation graphics are licensed under the [MIT License](LICENSE). Upstream history and copyright notices are retained. Dependency and bundled-data notices are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

DeepSeek, DeepSeek Harness, OpenCode Go and other third-party names or marks belong to their respective owners and are used only to identify compatibility or a test target. Asset provenance is recorded in [`assets/README.md`](assets/README.md).
