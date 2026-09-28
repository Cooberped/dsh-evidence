# Release Process / 发布流程

This is the maintainer runbook for `dsh-evidence`, the Cooberped community
fork of `taxueseek/dsh-files`.
It separates source integration, GitHub release, and npm publication so that a
successful build cannot publish externally without an explicit maintainer
decision.

本文是 Cooberped 社区 fork 的维护者发布手册。源码合并、GitHub Release 和 npm
发布是三个独立 Gate；测试通过不等于自动获得外部发布授权。

## Release authority / 发布权限

- Community contributors submit pull requests.
- Required checks run automatically.
- A human maintainer reviews and approves the change.
- GitHub auto-merge may merge an already-approved PR after all checks pass; it
  must never act as an automatic approval mechanism.
- Only a maintainer with release authority may create tags, GitHub releases, or
  npm publications.

社区贡献走 fork + PR；CI 自动检查，维护者人工审查。自动合并只执行已经批准的
合并决定。Tag、GitHub Release 和 npm 发布必须由有发布权限的维护者明确触发。

## One-time repository setup / 仓库一次性设置

`@baseland/dsh-evidence@0.6.0-beta.1` is already on npm, and GitHub has the
pre-release [`v0.6.0-beta.1`](https://github.com/Cooberped/dsh-evidence/releases/tag/v0.6.0-beta.1)
at commit `8bc0418593b4349ab4a6987d33cc86a21399a840`. The list below is what
still has to be true before a later publish. Publishing from GitHub without an
npm token stays off until the trusted publisher on npmjs.com and the `release`
environment approval are both in place. See
[Trusted publishing](#trusted-publishing--可信发布).

`@baseland/dsh-evidence@0.6.0-beta.1` 已经在 npm 上，GitHub 预发布
[`v0.6.0-beta.1`](https://github.com/Cooberped/dsh-evidence/releases/tag/v0.6.0-beta.1)
指向 commit `8bc0418593b4349ab4a6987d33cc86a21399a840`。下面仍是以后发布前要核对的事项。
在 npmjs.com 上把仓库登记为可信发布者、并且 GitHub 的 `release` 环境要求维护者批准之前，
GitHub 上这条不使用 npm token 的发布不会生效。见[可信发布](#trusted-publishing--可信发布)。

Configure and verify:

- repository topics include `dsh-plugin`, `deepseek-harness`, `documents`, and
  relevant format tags so the plugin is discoverable;
- `main` requires a pull request, required status checks, resolved
  conversations, and signed DCO commits;
- because GitHub's dependency-diff API rejects forks, the required
  `dependency-review` workflow uses the native action only for a detached
  repository and otherwise enforces the lockfile, production-license policy,
  and high-severity production audit locally in CI;
- while the project has only one human maintainer, required approvals remain 0
  so that the author is not forced to self-approve; after a second independent
  maintainer is established, require at least one approval and Code Owner
  review;
- force pushes and branch deletion are blocked;
- after a second independent maintainer is established, CODEOWNERS review is
  required for security, release, dependency, and core runtime changes;
- the one-time bootstrap PR may use a merge commit to retain the imported
  development history; enable squash-only merges immediately afterward;
- automatic branch deletion is enabled;
- GitHub Private Vulnerability Reporting is enabled;
- the GitHub environment named `release` requires maintainer approval before
  `.github/workflows/publish.yml` can upload a package;
- npm trusted publishing is linked on npmjs.com for that workflow before any
  tokenless publication (the steps are below; this repository stores no npm
  token);
- npm scope ownership is verified. The npm organization `@cooberped` could not
  be claimed, so the package is `@baseland/dsh-evidence` on the maintainer's
  npm account `baseland`. GitHub remains `Cooberped/dsh-evidence`. Publish only
  under `@baseland`: the unscoped names `dsh-files` and `dsh-evidence` are not
  this project's to take, and the scoped name must match `package.json`.

npm 组织 `@cooberped` 无法认领，因此包名是维护者 npm 账号 `baseland` 下的
`@baseland/dsh-evidence`。GitHub 仓库仍是 `Cooberped/dsh-evidence`。只发布这个
包名；不带组织前缀的 `dsh-files` 和 `dsh-evidence` 不属于本项目。

## Release gates / 发布 Gate

All gates are fail-closed. Record the exact release commit SHA.

### 1. Source and provenance

- The release branch starts from current `main` and contains only reviewed
  changes.
- Upstream `taxueseek/dsh-files` history and MIT copyright notice remain intact.
- Every post-bootstrap commit is DCO-signed; no CLA is required. The preserved
  legacy-import history through
  `ba6cead1b33a5bc53449918350be7618504076bf` is the sole documented exception.
- `git status --short` is empty for tracked and non-ignored untracked files.
- No private documents, HR/customer data, credentials, absolute user paths,
  session stores, generated real-data indexes, or ad hoc local configuration
  are present.

### 2. Quality and security

Run the checks defined by the release candidate and record their output:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

- P0 and P1 findings are zero.
- Session isolation, path containment, upload limits, parser limits, and
  coordinate readback have focused coverage.
- A fresh independent review has no unresolved release-blocking finding.
- Private Vulnerability Reporting is visible to a logged-in, non-maintainer
  GitHub user and is manageable from a maintainer account.

### 3. License, dependencies, and assets

- Review the locked production dependency tree and
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Review `npm audit` as a signal; triage findings instead of hiding or blindly
  overriding them.
- Every shipped/readme asset is `CONFIRMED` in
  [assets/README.md](assets/README.md). `PENDING` is a release blocker: obtain
  provenance or remove/replace the asset and its references.
- Confirm project `LICENSE`, `THIRD_PARTY_NOTICES.md`, README files, and required
  runtime files are in the package.

### 4. Package inspection

Build once from the exact release candidate, then inspect the actual tarball:

```bash
pnpm build
npm pack --dry-run
npm pack
tar -tf *.tgz
```

Inspect for secrets, private data, local paths, unexpected dependency assets,
source maps containing private paths, and missing notices. Install that tarball
into a clean temporary Harness profile and run the documented smoke test.

### 5. Beta publication

Pre-1.0 changes are published as prereleases first. For example:

- Git tag: `v0.6.0-beta.1`
- GitHub Release: mark as **pre-release**
- npm dist-tag: `beta`

`0.6.0-beta.1` is the package's first version, so npm also points `latest` at
it. npm will not delete `latest` while that is the only version. Both tags
naming `0.6.0-beta.1` is that registry rule, not a stable release. Say so in
the release notes, and tell people to install `@beta`.

`0.6.0-beta.1` 是这个包的第一个版本，所以 npm 把 `latest` 也指到了它。只剩这一个
版本时不能删掉 `latest`。两个标签都叫 `0.6.0-beta.1` 是注册表的规则，不是稳定版。
发布说明里要写清楚，并让用户安装 `@beta`。

Later prereleases still publish with `--tag beta`. That must leave `latest`
where it is. Do not pass `--tag latest`, and do not run `npm dist-tag add …
latest`, for a prerelease.

Verify the candidate version does not already exist, then publish only after a
maintainer approval. Prefer the trusted-publishing workflow below. A local
fallback must use a short-lived npm credential and must never commit or print
the token.

```bash
npm publish --access public --tag beta
```

The command above is an operator action, not a CI test. Do not run it during
ordinary pull-request validation. Merging a pull request does not publish.

### 6. Post-publication verification

- Verify the GitHub tag resolves to the recorded release SHA.
- Verify npm name, version, `beta` dist-tag, provenance, package contents,
  repository link, license, and install command.
- Install from npm into a clean profile with
  `dsh plugin --profile web add @baseland/dsh-evidence@beta` and run one
  upload, one search, and one coordinate read for the documented formats.
- Run `npm dist-tag ls @baseland/dsh-evidence`. After the first publish,
  `latest` and `beta` both name `0.6.0-beta.1`. A later prerelease may move
  `beta` only. `latest` moves only under
  [Stable promotion](#stable-promotion--稳定版).
- Publish checksums/evidence without user documents or secrets.

## Stable promotion / 稳定版

Do not move `latest` until a non-prerelease version has been published, after
people have actually used the beta and there is no open P0 or P1 issue. Review
compatibility with the beta people already installed, and record the exact
commit you shipped.

`0.6.0-beta.1` is not that version. Leave `latest` on it only for as long as
npm gives you no other choice. The next prerelease does not inherit `latest`.

When a stable version such as `0.6.0` is ready, and `package.json` no longer
has a prerelease suffix:

1. Publish that version with `--tag latest`. The manual workflow input
   `dist_tag=latest` does this. A GitHub Release by itself does not.
2. If that exact version is already on npm under another tag, point `latest`
   at the existing tarball instead of publishing it again:

```bash
npm dist-tag add @baseland/dsh-evidence@0.6.0 latest
npm dist-tag ls @baseland/dsh-evidence
```

Keep publishing prereleases with `--tag beta`. Do not delete the `beta` tag.
After promotion, `latest` should name the stable version and `beta` should
still name the pre-release you want people to try.

在有人实际用过 Beta、并且没有未解决的 P0 或 P1 之前，不要移动 `latest`。
要移动时，发出的必须是不带预发布后缀的版本，例如 `0.6.0`。

`0.6.0-beta.1` 不是这个版本。`latest` 现在指着它，只是因为这是包的第一个版本，
npm 不允许删掉唯一的 `latest`。以后的预发布只更新 `beta`，不要带动 `latest`。

稳定版准备好之后，用 `--tag latest` 发布；如果这个版本已经在 npm 上，就用
`npm dist-tag add @baseland/dsh-evidence@<版本> latest` 把 `latest` 指过去，
不要用同一个版本号再发一次。`beta` 标签留着，继续给预发布用。
只在 GitHub 上发一个正式 Release 不会移动 `latest`。

## Trusted publishing / 可信发布

`.github/workflows/publish.yml` publishes with GitHub's OIDC token
(`id-token: write`). npm exchanges that token for a short-lived publish
credential. The repository does not contain an npm token, and the workflow
must not be given `NPM_TOKEN` or `NODE_AUTH_TOKEN`.

Adding the workflow does not publish. It does not run on push or pull request.
It runs when a maintainer starts it by hand, or when someone publishes a GitHub
**pre-release**. The job uses the GitHub environment `release`, which must
require a maintainer's approval. A normal GitHub release (not marked
pre-release) does not upload anything and does not move `latest`.

The hand-started run defaults to `--tag beta`. Choosing `latest` is the
explicit stable input. The job refuses that choice when `package.json` still
contains a prerelease suffix such as `-beta.1`. A GitHub pre-release always
publishes with `--tag beta`.

`npm publish` in the workflow runs `prepublishOnly`, which is `release:check`.
A failing check stops the publish before npm accepts the tarball. Provenance
is requested with `--provenance`. npm also attaches provenance automatically
for a public package published this way from a public repository.

Trusted publishing needs npm CLI 11.5.1 or newer and Node.js 22.14.0 or newer,
on a GitHub-hosted runner. The workflow uses Node.js 24.3.0, the same version
as the release check in CI, then installs npm 11.5.1. npm does not accept this
OIDC flow from a self-hosted runner. `repository.url` in `package.json` must
stay `git+https://github.com/Cooberped/dsh-evidence.git`.

### One-time setup on npmjs.com

Do this once, as the `baseland` account that owns `@baseland/dsh-evidence`,
after `publish.yml` is on the default branch. npm does not check the fields
when you save them. A typo shows up only on the next publish.

1. Open the package on npmjs.com, signed in as `baseland`:
   <https://www.npmjs.com/package/@baseland/dsh-evidence>
2. Settings → Trusted Publisher → GitHub Actions.
3. Enter:
   - Organization or user: `Cooberped`
   - Repository: `dsh-evidence`
   - Workflow filename: `publish.yml` (the file name only, including `.yml`)
   - Environment name: `release` (same name as the workflow's `environment`)
   - Allowed actions: allow direct `npm publish`. The workflow runs
     `npm publish`, not `npm stage publish`.
4. On GitHub, open Settings → Environments → `release` and require approval
   from a maintainer **before** the first run. If that protection is missing,
   GitHub creates the environment on the first run with no reviewer.
5. Do not add an npm token to GitHub. Do not commit one.
6. After one publish through this workflow has succeeded, you can tighten the
   package: Settings → Publishing access → "Require two-factor authentication
   and disallow tokens". Trusted publishing keeps working. A local fallback
   then needs an interactive login, not a token stored in the repo.

`.github/workflows/publish.yml` 用 GitHub 的 OIDC（`id-token: write`）向 npm 要一次
短期发布凭据。仓库里不放 npm token，也不要给这个 workflow 配置 `NPM_TOKEN` 或
`NODE_AUTH_TOKEN`。

把文件加进仓库不会发布。push 和 pull request 都不会跑它。维护者手动启动，或者有人
发布一个标成 **pre-release** 的 GitHub Release 时才会跑，并且会停在名为 `release`
的 GitHub 环境上等待维护者批准。没有标成 pre-release 的 GitHub Release 不会上传，
也不会移动 `latest`。

手动启动时默认 `--tag beta`。只有明确选 `latest` 才当作稳定版；如果 `package.json`
的版本号还带 `-beta` 这类后缀，任务会拒绝。GitHub pre-release 一律只用 `--tag beta`。

workflow 里的 `npm publish` 会先跑 `prepublishOnly`（也就是 `release:check`）。
检查失败就不会把包交给 npm。命令带 `--provenance`。公开仓库发布公开包时，npm
也会自动附上来源证明。

这条路径要求 npm CLI 11.5.1 或更新、Node.js 22.14.0 或更新，并且是 GitHub 托管的
runner。workflow 使用与 CI 发布检查相同的 Node.js 24.3.0，再安装 npm 11.5.1。
自托管 runner 不能用这套 OIDC。`package.json` 里的 `repository.url` 必须保持
`git+https://github.com/Cooberped/dsh-evidence.git`。

### 在 npmjs.com 上做一次

用拥有 `@baseland/dsh-evidence` 的 `baseland` 账号操作。先把 `publish.yml` 合并到
默认分支。npm 保存时不校验这些字段，写错要到下一次发布才看得到。

1. 登录 npmjs.com，打开 <https://www.npmjs.com/package/@baseland/dsh-evidence>。
2. Settings → Trusted Publisher → GitHub Actions。
3. 填写：
   - Organization or user：`Cooberped`
   - Repository：`dsh-evidence`
   - Workflow filename：`publish.yml`（只写文件名，带 `.yml`）
   - Environment name：`release`（与 workflow 里的 `environment` 相同）
   - Allowed actions：允许直接 `npm publish`。workflow 跑的是 `npm publish`，
     不是 `npm stage publish`。
4. 在 GitHub 上打开 Settings → Environments → `release`，**第一次运行之前**就要求
   维护者批准。如果没有这层保护，GitHub 会在第一次运行时建出一个没有审批人的环境。
5. 不要把 npm token 加到 GitHub，也不要提交到仓库。
6. 这条 workflow 成功发布过一次之后，可以收紧包的设置：Settings → Publishing access
   → “Require two-factor authentication and disallow tokens”。可信发布仍然可用。
   本机补发则改为交互登录，而不是在仓库里存 token。

## Failed release / 发布失败

- Stop immediately on provenance, credential, privacy, license, or package-name
  ambiguity.
- Preserve the candidate and logs, redact secrets, and isolate the smallest
  failing step.
- Prefer publishing a corrected version and deprecating a broken version over
  relying on npm unpublish. Never replace artifacts under the same version.
- For a security incident, follow [SECURITY.md](SECURITY.md) and coordinate the
  advisory before public details.
