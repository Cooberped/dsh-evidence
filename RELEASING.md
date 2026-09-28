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
at commit `8bc0418593b4349ab4a6987d33cc86a21399a840`. That first publish used a
granular access token on the `baseland` account. The token is not in this
repository. Later publishes should use trusted publishing, which stays off
until the publisher on npmjs.com and the `release` environment approval are
both in place. See [Trusted publishing](#trusted-publishing--可信发布).

`@baseland/dsh-evidence@0.6.0-beta.1` 已经在 npm 上，GitHub 预发布
[`v0.6.0-beta.1`](https://github.com/Cooberped/dsh-evidence/releases/tag/v0.6.0-beta.1)
指向 commit `8bc0418593b4349ab4a6987d33cc86a21399a840`。这一次是用 `baseland`
账号的 granular access token 发出的，token 不在仓库里。以后的发布改走可信发布；
在 npmjs.com 上登记发布者、并且 GitHub 的 `release` 环境要求维护者批准之前，
这条路径不会生效。见[可信发布](#trusted-publishing--可信发布)。

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

The next prerelease is `0.6.0-beta.2` (`package.json` on `main` after the
version bump is merged). Merging that pull request does not publish, and it
does not create a GitHub tag or Release. A maintainer does both afterward:

- npm: `npm publish --access public --tag beta`. If the trusted publisher on
  npmjs.com and the `release` environment approval are already in place, the
  manual workflow with dist-tag `beta` is the same publish. This document does
  not record that the publisher has been saved on npmjs.com.
- After that publish, `beta` names `0.6.0-beta.2` and `latest` still names
  `0.6.0-beta.1`.
- GitHub: create the pre-release tag `v0.6.0-beta.2` by hand, on the merge
  commit. Do not let CI create it.

下一次预发布是 `0.6.0-beta.2`（版本号合并进 `main` 之后，以 `package.json` 为准）。
合并那个 pull request 不会发布，也不会创建 GitHub tag 或 Release。两件事都由维护者
在合并之后单独做：

- npm：`npm publish --access public --tag beta`。若 npmjs.com 上的可信发布者和
  `release` 环境的批准都已经配好，手动跑发布 workflow 并选择 dist-tag `beta`
  是同一次发布。本文不记录发布者已经在 npmjs.com 上保存。
- 发出之后，`beta` 指向 `0.6.0-beta.2`，`latest` 仍是 `0.6.0-beta.1`。
- GitHub：手工创建 pre-release，tag 为 `v0.6.0-beta.2`，指向合并 commit。不要让
  CI 创建。

Verify the candidate version does not already exist, then publish only after a
maintainer approval. Prefer the trusted-publishing workflow below. A local
fallback must use a short-lived npm credential and must never commit or print
the token.

```bash
npm publish --access public --tag beta
```

The command above is an operator action, not a CI test. Do not run it during
ordinary pull-request validation. Merging a pull request does not publish, and
neither does pushing a tag.

### 6. Post-publication verification

- Verify the GitHub tag resolves to the recorded release SHA.
- Verify npm name, version, `beta` dist-tag, provenance, package contents,
  repository link, license, and install command.
- Install from npm into a clean profile with
  `dsh plugin --profile web add @baseland/dsh-evidence@beta` and run one
  upload, one search, and one coordinate read for the documented formats.
- Run `npm dist-tag ls @baseland/dsh-evidence`. After the first publish,
  `latest` and `beta` both name `0.6.0-beta.1`. A later prerelease may move
  `beta` only. After `0.6.0-beta.2` is published with `--tag beta`, `beta`
  names `0.6.0-beta.2` and `latest` still names `0.6.0-beta.1`. `latest` moves
  only under [Stable promotion](#stable-promotion--稳定版).
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

1. Publish that version with `--tag latest`. Start
   `.github/workflows/publish.yml` by hand and choose `dist_tag=latest`.
   Pushing a tag, or publishing a GitHub Release, does not upload the package
   and does not move `latest`.
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
推 tag，或在 GitHub 上发 Release，都不会上传包，也不会移动 `latest`。
要发稳定版，得手动跑 `.github/workflows/publish.yml` 并选择 `dist_tag=latest`。

## Trusted publishing / 可信发布

`0.6.0-beta.1` was published with a granular access token. Trusted publishing
is how later versions go out. `.github/workflows/publish.yml` asks GitHub for
an OIDC token and npm exchanges it for a short-lived publish credential.
There is no npm token in the repository, and this workflow must not be given
an `NPM_TOKEN` secret.

The publish job sets `permissions: contents: read` and `id-token: write`.
`id-token: write` is what lets GitHub mint the OIDC token. The job also sets
`environment: release`. On GitHub, that environment must require a maintainer
reviewer before the first run. Pushing a commit, opening a pull request, or
pushing a tag does not publish. A maintainer starts the workflow by hand, and
the environment approval is the second check. If a tag trigger is added later,
keep `environment: release` so a tag push still waits for that reviewer.

The manual run defaults to `--tag beta`. Use that for prerelease versions.
`latest` is a separate input, and the job accepts it only when `package.json`
has no prerelease suffix. A version such as `0.6.0-beta.2` cannot move
`latest`.

`actions/setup-node` is called with `registry-url: https://registry.npmjs.org`.
That is the OIDC setup in the current npm docs. It writes a project `.npmrc`
that can read `NODE_AUTH_TOKEN`. Leave that file as the action wrote it. Do
not create `NPM_TOKEN`. With npm 11.5.1 or newer, the CLI uses the OIDC token
for `npm publish` before it falls back to a stored token.

The workflow pins Node.js 24.5.0 because that is the first Node.js 24 release
whose bundled npm is 11.5.1. Node.js 24.3.0, which CI still uses for the
release check, bundles npm 11.4.2. That older CLI fails the OIDC handshake and
reports a misleading `E404`. Do not "fix" the publish job by dropping back to
24.3.0 or by publishing with an older npm. The job checks the bundled npm
version and stops if it is below 11.5.1. npm does not accept this OIDC flow
from a self-hosted runner. `repository.url` in `package.json` must stay
`git+https://github.com/Cooberped/dsh-evidence.git`.

`npm publish` runs `prepublishOnly`, which is `release:check`. A failing check
stops the upload. The command passes `--provenance`. npm also attaches
provenance on its own for a public package published this way from a public
repository.

### One-time setup on npmjs.com

Do this once, as the `baseland` account that owns `@baseland/dsh-evidence`,
after `publish.yml` is on the default branch. npm does not check the fields
when you save them. A typo shows up only on the next publish, often as an
authentication failure rather than "wrong repository".

1. Open the package on npmjs.com, signed in as `baseland`:
   <https://www.npmjs.com/package/@baseland/dsh-evidence>
2. Settings → Trusted Publisher → GitHub Actions.
3. Match these fields exactly:
   - Organization or user: `Cooberped`
   - Repository: `dsh-evidence`
   - Workflow filename: `publish.yml`
     Enter only the filename, including `.yml`. Not
     `.github/workflows/publish.yml`.
   - Environment name: `release`
     This field is optional on npm. Fill it in because the workflow sets
     `environment: release`. If you leave it blank on npm, delete
     `environment:` from the workflow, or the publish will be rejected.
   - Allowed actions: allow direct `npm publish`. The workflow runs
     `npm publish`, not `npm stage publish`.
4. On GitHub, open Settings → Environments → `release` and require approval
   from a maintainer **before** the first run. If that protection is missing,
   GitHub creates the environment on the first run with no reviewer.
5. Do not add `NPM_TOKEN` or any other npm token to the repository or to
   GitHub Actions secrets. The granular token used for `0.6.0-beta.1` stays
   out of git as well.
6. After one publish through this workflow has succeeded, you can tighten the
   package: Settings → Publishing access → "Require two-factor authentication
   and disallow tokens". Trusted publishing keeps working. A local fallback
   then needs an interactive login, not a token stored in the repo.

`0.6.0-beta.1` 是用 granular access token 发出的。以后的版本走可信发布。
`.github/workflows/publish.yml` 向 GitHub 要 OIDC token，npm 再换成一次短期发布凭据。
仓库里没有 npm token，也不要给这个 workflow 配 `NPM_TOKEN`。

发布 job 的权限是 `contents: read` 和 `id-token: write`。后者才让 GitHub 签发
OIDC token。job 还设置了 `environment: release`。在 GitHub 上，这个环境必须在第一次
运行前就要求维护者批准。push、pull request、推 tag 都不会发布。维护者手动启动 workflow，
环境批准是第二道检查。以后如果改成由 tag 触发，仍然要留着 `environment: release`，
这样推 tag 也会停下来等人批。

手动运行默认 `--tag beta`，预发布用这个。`latest` 是另一个选项，只有 `package.json`
的版本号不带预发布后缀时才会接受。`0.6.0-beta.2` 这种版本不能去动 `latest`。

`actions/setup-node` 使用 `registry-url: https://registry.npmjs.org`。这是当前 npm
文档里的 OIDC 写法，它会在仓库目录写一份可读 `NODE_AUTH_TOKEN` 的 `.npmrc`。留着这份文件，
不要另建 `NPM_TOKEN`。npm 11.5.1 及更新版本在 `npm publish` 时会先用 OIDC token，
然后才回退到保存的 token。

workflow 固定 Node.js 24.5.0，因为这是第一版自带 npm 11.5.1 的 Node.js 24。
CI 里发布检查仍用的 Node.js 24.3.0 自带 npm 11.4.2。那个旧 CLI 做 OIDC 握手会失败，
并报一个容易看错的 `E404`。不要把发布 job 降回 24.3.0，也不要用更旧的 npm 去发布。
job 会检查自带的 npm，低于 11.5.1 就停。自托管 runner 不能用这套 OIDC。
`package.json` 里的 `repository.url` 必须保持
`git+https://github.com/Cooberped/dsh-evidence.git`。

`npm publish` 会先跑 `prepublishOnly`（也就是 `release:check`）。检查失败就不会上传。
命令带 `--provenance`。公开仓库发布公开包时，npm 也会自动附上来源证明。

### 在 npmjs.com 上做一次

用拥有 `@baseland/dsh-evidence` 的 `baseland` 账号操作。先把 `publish.yml` 合并到
默认分支。npm 保存时不校验这些字段，写错要到下一次发布才看得到，而且多半显示成认证失败，
而不是「仓库填错了」。

1. 登录 npmjs.com，打开 <https://www.npmjs.com/package/@baseland/dsh-evidence>。
2. Settings → Trusted Publisher → GitHub Actions。
3. 下面几项必须逐字一致：
   - Organization or user：`Cooberped`
   - Repository：`dsh-evidence`
   - Workflow filename：`publish.yml`
     只填文件名，带 `.yml`。不要填 `.github/workflows/publish.yml`。
   - Environment name：`release`
     这一项在 npm 上可以不填。workflow 写了 `environment: release`，所以这里要填。
     如果 npm 上留空，就要把 workflow 里的 `environment:` 也去掉，否则发布会被拒绝。
   - Allowed actions：允许直接 `npm publish`。workflow 跑的是 `npm publish`，
     不是 `npm stage publish`。
4. 在 GitHub 上打开 Settings → Environments → `release`，**第一次运行之前**就要求
   维护者批准。如果没有这层保护，GitHub 会在第一次运行时建出一个没有审批人的环境。
5. 不要把 `NPM_TOKEN` 或任何 npm token 放进仓库，也不要放进 GitHub Actions secrets。
   发 `0.6.0-beta.1` 用过的 granular token 同样不要进 git。
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
