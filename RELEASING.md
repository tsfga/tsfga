# Releasing

Step-by-step guide for publishing `@tsfga/core` or
`@tsfga/kysely` to npm.

## Prerequisites

- Push access to `emfga/tsfga`
- npm Trusted Publisher configured for both packages
  (repository: `emfga/tsfga`, workflow: `release.yml`)

## 1. Bump the version

```bash
# In the repo root:
scripts/bump.sh packages/core minor   # or patch / major
scripts/bump.sh packages/kysely minor
```

Commit the version bump, open a PR, and merge. Optionally
add a changeset (`bun run changeset`) to document the
change for release notes.

## 2. Trigger the release workflow

1. Go to **Actions** → **Release** on `emfga/tsfga`
2. Select the package
3. Check **Publish to npm**
4. Click **Run workflow**

Without the publish checkbox, the workflow validates the
build (dry run) without publishing.

Release `@tsfga/core` before `@tsfga/kysely` when both
have changes, since kysely depends on core.

## 3. Verify

```bash
npm view @tsfga/core@<version>
npm view @tsfga/kysely@<version>
```

Check the GitHub release was created with the correct tag
(`@tsfga/core@<version>` or `@tsfga/kysely@<version>`).

## 4. Edit release notes (optional)

The workflow generates release notes from git history and
PR labels. Edit the GitHub release if custom notes are
needed.

### Using changesets for release notes

When preparing a release, maintainers can create a
changeset to document user-facing changes:

```bash
bun run changeset
```

The changeset body becomes part of release notes — write
it for end users. Bump types: `major` (breaking), `minor`
(features), `patch` (fixes/tooling). Changesets are not
required — they are a convenience for structuring release
notes.

Bot PRs (Renovate, Dependabot) and external contributor
PRs do not need changesets. Maintainers add them when
the change warrants a release note entry.

## How it works

**Workflow restriction:** The release job has
`if: github.repository == 'emfga/tsfga'` — it will not
run on forks.

**No commits to main:** The workflow does not create any
commits. Version bumps happen in PRs. The workflow
publishes whatever version is already in `package.json`,
creates a git tag, and pushes the tag (not main).

**Workspace protocol resolution:** For `@tsfga/kysely`,
the workflow temporarily replaces `workspace:*` references
to `@tsfga/core` with the actual version before publishing,
then reverts the change.

**OIDC Trusted Publishing:** npm verifies the GitHub
Actions workflow identity via Sigstore — no long-lived
npm token needed. The `--provenance` flag adds attestation
linking each package to its source repo and build.

**Tag convention:** `@tsfga/core@0.2.0`,
`@tsfga/kysely@0.2.0`.
