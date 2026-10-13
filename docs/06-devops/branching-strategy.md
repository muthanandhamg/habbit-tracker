# Branching Strategy

> Owner: Muthanandham | Jira: HT-13 | Last updated: 2026-10-13

## 1. Branching model

We use **GitHub Flow**.

**Why:**
- Solo developer: one simple flow, no confusion about which branch to use.
- Only one long-lived branch (`master`) and it always matches production. The CI/CD pipeline needs one deploy trigger: merge to `master` → deploy.

**Not chosen:**
- **GitFlow:** too heavy for a solo developer shipping small, frequent releases. The extra `develop`, `release/` and `hotfix/` branches add overhead without benefit.
- **Trunk-based:** not yet. There is no CI pipeline and the automated tests don't run. Revisit after R1, once the Jenkins pipeline and tests are reliable.

## 2. Branch naming

**Format:** `<prefix>/HT-<ticket>-<short-description>`

- Lowercase, words separated by `-`
- The Jira key (`HT-xx`) links the branch, commits and PR to the Jira ticket automatically

| Prefix | Used for | Example |
|--------|----------|---------|
| `feat/` | New feature or capability | `feat/HT-16-dockerize-app` |
| `fix/` | Something broken that now works | `fix/HT-23-ansible-ssh-config` |
| `docs/` | Text or documentation changes only | `docs/HT-13-branching-strategy` |
| `chore/` | Maintenance and upgrades users don't notice | `chore/HT-30-upgrade-node-20` |
| `ci/` | Pipeline changes (Jenkins, GitHub Actions) | `ci/HT-25-jenkins-pipeline` |
| `hotfix/` | Urgent fix while production is broken | `hotfix/HT-40-wrong-db-password` |

## 3. Commit messages

We use **Conventional Commits**: `<type>: <short description>`, using the same types as the branch prefixes.

- `feat: add server Dockerfile`
- `fix: correct ansible inventory path`
- `docs: add branching strategy`

**Important:** we squash-merge, so the **PR title becomes the commit message on `master`**. PR titles must follow this format too.

## 4. Merge strategy

We use **squash and merge** only.

**Why:** one commit per feature keeps `master` history readable, and a whole feature can be undone with a single `git revert`.

**Enforced in GitHub** (Settings → General → Pull Requests):
- Merge commits: disabled
- Squash merging: enabled (only option)
- Rebase merging: disabled
- Head branches deleted automatically after merge

## 5. `master` protection rules

| Rule | Setting | Why |
|------|---------|-----|
| Require a pull request before merging | ON | Every change is recorded and reviewable in a PR; no direct pushes |
| Required approvals | 0 | Solo developer; GitHub doesn't allow approving your own PR. Required CI checks will act as the reviewer from R1 |
| Do not allow bypassing | ON | Without it, admins (the repo owner) bypass every rule, as the first push test proved |
| Lock branch | OFF | Lock makes the branch read-only and blocks PR merges too |

## 6. Workflow

1. `git switch master && git pull`
2. `git switch -c <prefix>/HT-<ticket>-<description>`
3. Make changes and commit with Conventional Commits
4. `git push -u origin <branch>`
5. Open a PR: Conventional Commit title + What / Why / How to test
6. Squash and merge (the branch is deleted automatically on GitHub)
7. `git switch master && git pull`, then `git branch -D <branch>` locally