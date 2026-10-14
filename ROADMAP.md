# DevOps Journey Roadmap: Life-OS (Habit Tracker)

> **Read this first, every session.** This file is our shared memory. It records why we're doing this,
> how we work, what the "clients" asked for, and where we are right now.
> Update the **Current Status** and **Session Log** at the end of each session.

---

## 1. Why we are doing this

The application (Life-OS, a MERN + AI habit tracker) is **feature complete**. The goal now is **not** to just
deploy it. It's to **learn real DevOps by doing**: build, break, debug, test, analyze, handle incidents,
plan strategy, and document it the way you would on a real team.

Each requirement below is written as a **client brief**. Different clients want different things (on-prem,
AWS VMs, AWS-native tooling, Kubernetes, enterprise SSO), so you get hands-on time with the whole skill list.

### Ground rules (non-negotiable)

| Who | Role | Does | Does NOT |
|---|---|---|---|
| **You** | DevOps Engineer | All infra, pipelines, Docker, K8s, IaC, Ansible, monitoring, security tooling, Git flow, Jira, docs | — |
| **Claude** | **Mentor / Tech Lead** | Explains concepts, gives direction, reviews your work, asks "why?", points at what to research | Write your DevOps code, configs, or solutions |
| **Claude** | **Developer** | Fixes *application* code bugs and writes the dev handoff doc when you ask for it | Touch DevOps files |
| **Claude** | **Client / Stakeholder** | Answers your requirement-gathering questions in character, changes scope mid-way (like real clients) | — |
| **Claude** | **Chaos Agent** | Injects incidents for you to troubleshoot (only when you ask for a "game day") | Tell you the root cause up front |

**How to ask for help without getting the answer:**
- "Hint level 1": a direction / concept to research
- "Hint level 2": narrow it to the area (file, service, setting)
- "Hint level 3": explain the concept with a *generic* example (not your config)
- "Review my work": Claude points at problems and asks questions, not fixes

---

## 2. The application (what you are deploying)

| Item | Value |
|---|---|
| Repo layout | npm workspaces: `client/` (React + Vite), `server/` (Express + TS), `shared/` (TS types) |
| Runtime | Node.js >= 18 |
| Build | `npm run build` (shared, then client, then server) |
| Server start | `npm run start` serves `server/dist/index.js` on `PORT` (default 5000) |
| Client output | static files in `client/dist/` (served by a web server or CDN) |
| Health check | `GET /health` |
| Database | **MongoDB** (falls back to in-memory if unavailable, which is **not** acceptable in prod!) |
| External deps | AI provider: Hugging Face (`HF_TOKEN`) or Gemini (`GEMINI_API_KEY`) |
| Env vars | `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `AI_PROVIDER`, `HF_TOKEN`, `HF_MODEL`, `GEMINI_API_KEY` |
| Tests | Vitest (server unit), Playwright (E2E), ESLint |

> ⚠️ **Known gap (good first finding):** `docs/06-devops/deployment-runbook.md` is outdated and doesn't match the
> real code. Finding the differences is part of Phase 0.
>
> ⚠️ **Skill-list mismatch:** your skill list has **RDS/MySQL**, but this app uses **MongoDB**. Real DevOps engineers
> hit this all the time. You'll deal with it in Requirement 2 (see the ADR task there).

---

## 3. Phase 0: Project Kickoff (do this before any infra)

**Goal:** Work like a real team from day one. No infra until this phase is done.

| # | Task | Done when |
|---|---|---|
| 0.1 | **Jira setup** in space `habbit tracker`: one **Epic per requirement** (R1 to R5), Stories under each, sprint of 1 to 2 weeks | Board shows Epics R1 to R5, Sprint 1 started with Phase 0 + R1 stories |
| 0.2 | **Request the dev handoff.** Ask the Developer (Claude) for a handoff doc: ports, env vars, build/run, dependencies, known issues | `docs/06-devops/dev-handoff.md` exists (Claude writes this as developer) |
| 0.3 | **Requirement gathering.** For each requirement, write the questions *you* would ask the client (SLA, users, budget, data residency, RTO/RPO, compliance). Ask Claude-as-client | A "Questions & Answers" page per requirement (Confluence or `docs/devops/`) |
| 0.4 | **Audit the existing runbook** vs. the real code; list every mismatch | Jira ticket(s) with the findings |
| 0.5 | **Branching strategy.** Choose one (GitFlow / GitHub Flow / trunk-based), write *why*, protect `master`, require PRs | Branch protection on GitHub, strategy doc written, first PR merged |
| 0.6 | **Local baseline.** Build and run the app from a clean clone using *only* the handoff doc | You can log in and use the app locally; any doc gaps are reported back to the developer |
| 0.7 | **AWS account safety** (before R2): MFA on root, no root access keys, an admin IAM user/role for yourself, **AWS Budgets alert** | Budget alert email received in test; root locked down |

---

## 4. The Client Requirements

Each requirement = one Jira Epic. Do them **in order**, since each builds on the last.

---

### R1: "MindfulMed Clinics": On-Premises Deployment

> **Client brief:** *"We're a small chain of wellness clinics. For data privacy reasons our data must stay on our own
> servers, not in any public cloud. We have Linux machines in our server room. Our IT person is not a developer, so
> provisioning must be repeatable with one command. We want automated builds and we're worried about security."*

**Environment:** Local VMs simulating on-prem servers (Multipass / Vagrant + VirtualBox / KVM), Ubuntu.
Suggested: 1 VM for the app, 1 VM for the DB, 1 VM for CI (Jenkins + SonarQube).

**Must have**
- Containerized app: **Docker** images for client and server, multi-stage, non-root, small
- **Docker Compose** stack (app + MongoDB + reverse proxy) with persistent volumes
- Images pushed to **Docker Hub** (versioned tags, never only `latest`)
- **Ansible** playbooks + roles: harden the servers (users, SSH key-only, firewall), install Docker, deploy the stack
- **Jenkins** pipeline (Jenkinsfile in the repo): lint → test → build → scan → push → deploy via Ansible
- **DevSecOps gates:** **GitLeaks** (secrets), **SonarQube** (code quality gate), **Trivy** (image + filesystem vulns). The pipeline **fails** on critical findings
- **Bash** scripts: MongoDB backup + restore, rotation of old backups
- Secrets never in Git: Jenkins credentials / Ansible Vault

**Acceptance criteria**
- [ ] Fresh VMs → one Ansible command → app running and reachable via the proxy
- [ ] A push to a branch triggers Jenkins; a PR with a fake secret is **blocked**
- [ ] Trivy report archived as a build artifact
- [ ] Backup → delete DB → restore works (you demonstrate it)
- [ ] App survives a VM reboot (restart policies)

**Skills:** Linux, SSH, Bash, Docker, Docker Hub, Compose, Ansible, Jenkins, SonarQube, GitLeaks, Trivy, Secrets Mgmt, Security hardening

**Traps to watch for (research these):** `.dockerignore`, npm workspaces inside Docker builds, how the client finds the API URL at build time vs runtime, MongoDB auth, Jenkins agent permissions to run Docker.

---

### R2: "FitStart Inc.": AWS Lift-and-Shift MVP with Terraform

> **Client brief:** *"We're a startup. We want the app on AWS, highly available across 2 AZs, on our own domain with
> HTTPS. Infra must be code, reviewable in PRs. Our budget is tight, so tell us the monthly cost. We use GitHub."*

**Must have**
- **Terraform with reusable modules**: `vpc`, `security`, `compute`, `alb`, `database`, `dns`; remote state (S3 + locking)
- **Networking from scratch:** VPC, public/private subnets in 2 AZs, Route Tables, IGW, **NAT Gateway**, Security Groups, **NACLs**
- **EC2 in an Auto Scaling Group** (private subnets) behind an **ALB**, launch template, **EBS**-backed
- Frontend on **S3** (static hosting, optionally CloudFront)
- **Route 53** domain/subdomain + ACM certificate (HTTPS only)
- Container images in **Amazon ECR** (with scan on push)
- **GitHub Actions** CI/CD: PR → lint/test/scan/`terraform plan` as a PR comment; merge → build → push ECR → deploy (rolling refresh)
- **OIDC** from GitHub Actions to AWS (no long-lived access keys!)
- **IAM** least-privilege: instance role, CI role; **Secrets Manager or SSM Parameter Store** for app secrets
- **CloudWatch:** logs from the app, alarms (5xx, CPU, unhealthy hosts), one dashboard, SNS email alerts
- **Database decision (ADR required):** the client's CTO says *"use RDS, we know it."* The app uses MongoDB. Write
  `ADR-002` comparing Amazon DocumentDB vs MongoDB on EC2 vs MongoDB Atlas vs "ask devs to migrate to RDS MySQL" (cost, effort, risk). Present it to the client (Claude) and defend it
- **Python boto3** script: report all running resources + estimated cost; a "nuke" script for your dev env

**Acceptance criteria**
- [ ] `terraform apply` from zero → working HTTPS app; `terraform destroy` leaves nothing behind
- [ ] Kill an EC2 instance → ASG replaces it, users see no downtime
- [ ] Deploy with zero downtime via GitHub Actions only (no console clicking)
- [ ] An alarm fires and you receive the email (trigger it on purpose)
- [ ] Monthly cost estimate document (with what you'd cut to save money)

**Skills:** AWS (VPC, EC2, ASG, ALB, EBS, S3, IAM, Route 53, ECR, CloudWatch), Terraform modules, GitHub Actions, networking, IAM, Python boto3, Cost optimization

**💸 Cost warning:** NAT Gateway and ALB cost money **every hour**, even idle. Always `destroy` at the end of a session.
Check current AWS pricing yourself; that's part of the cost task.

---

### R3: "GovHealth Partners": AWS-Native Pipeline with CloudFormation

> **Client brief:** *"Our security team only approves AWS-native services, so no Jenkins or GitHub Actions in production paths.
> We need staging and production environments, blue/green deployments, and a manual approval before production.
> Our compliance team needs an audit trail of every change."*

**Must have**
- Infra in **AWS CloudFormation** (nested stacks or StackSets), **not** Terraform. Compare the two in a doc afterwards
- **AWS CodePipeline:** Source → **CodeBuild** (test + scan + build) → deploy to staging → **manual approval** → prod
- **AWS CodeDeploy** with **blue/green** deployment (EC2/ASG or ECS) and automatic rollback on alarm
- `buildspec.yml` and `appspec.yml` written by you; deployment lifecycle hooks as Bash scripts
- Separate staging & prod (separate stacks, at minimum; separate accounts for bonus)
- Audit: CloudTrail enabled; who-approved-what visible
- Use **Amazon Q / GitHub Copilot** for help, then write a short note on where AI helped and where it was **wrong**

**Acceptance criteria**
- [ ] A commit flows to staging automatically; prod only after you click Approve
- [ ] A deliberately broken release triggers **automatic rollback**
- [ ] Release notes + versioning (semantic tags) for each prod release
- [ ] Doc: CloudFormation vs Terraform, what you'd recommend to this client and why

**Skills:** CloudFormation, CodePipeline, CodeBuild, CodeDeploy, Release Management, YAML/JSON, AI-assisted DevOps

---

### R4: "ScaleHabit Global": Kubernetes on Amazon EKS

> **Client brief:** *"We're expecting 100k users after a marketing launch. The app must scale automatically under load and
> scale down at night to save money. We want deep visibility: metrics, logs, dashboards. Our engineers log in with Okta.
> Nobody gets admin by default."*

**Must have**
- **EKS** cluster provisioned with **Terraform modules** (reuse your R2 VPC module!), managed node groups
- Kubernetes manifests (or Helm charts you write): Deployments, Services, Ingress (AWS Load Balancer Controller), ConfigMaps, Secrets, probes, resource requests/limits, PodDisruptionBudgets
- **Horizontal Pod Autoscaler** on the API + **Cluster Autoscaler** (or Karpenter, justify) for nodes. Prove it with a load test
- Images from **ECR**, pulled via IRSA / Pod Identity (no static keys)
- **Prometheus + Grafana** (cluster + app metrics, ask the developer for a `/metrics` endpoint, which is a real dev request!)
- **ELK stack** (Elasticsearch, Logstash/Fluent Bit, Kibana) for centralized logs, and compare with CloudWatch Container Insights
- **RBAC:** namespaces per environment, read-only role for devs, admin for DevOps only
- **Okta**: SSO into Grafana (and AWS via IAM Identity Center); **SCIM** provisioning so a user added to an Okta group gets access automatically, and removed users lose it. Use an Okta developer account
- CI/CD (your choice of Jenkins or GitHub Actions, justify) deploys to EKS with image scanning in the pipeline

**Acceptance criteria**
- [ ] Load test → pods scale out → nodes scale out → load stops → everything scales back in
- [ ] A Grafana dashboard showing request rate, error rate, latency (RED metrics) + an alert
- [ ] Find a specific failed request's logs in Kibana in under 1 minute
- [ ] Okta user added to group → can log into Grafana; removed → cannot
- [ ] A dev-role user cannot `kubectl delete` in prod namespace

**Skills:** Kubernetes, EKS, HPA, Cluster Autoscaler, Prometheus, Grafana, ELK, Okta, SSO, SCIM, RBAC, IAM roles

**💸 Cost warning:** EKS control plane + nodes + NAT + load balancers add up fast. Plan sessions, destroy after each one.

---

### R5: "Operations Excellence": Run It Like Production (continuous, alongside R2 to R4)

> **Client brief:** *"We had an outage last month and nobody knew what happened. We want an on-call process, runbooks,
> post-mortems, and a monthly cost review."*

**Must have**
- **Game days:** ask Claude (Chaos Agent) to break something in your running environment or code. You get only the symptom
  (e.g. "users report 502s"). You troubleshoot, fix, then write a blameless **RCA** (timeline, root cause, 5 whys, action items)
- Incident severity levels (SEV1 to SEV3), escalation path, on-call runbook per alert
- **Release management:** release checklist, change tickets in Jira, rollback plan for every release
- **Cost optimization review:** right-sizing, Spot instances, scheduling non-prod shutdown, S3 lifecycle, unused EBS/EIP cleanup (boto3 script)
- Updated `docs/06-devops/` (runbook, incident-response, observability-plan) to reflect *reality*

**Acceptance criteria**
- [ ] At least **5 incidents** handled with RCAs (mix of: app bug, config error, network/SG, resource exhaustion, expired secret/cert)
- [ ] Every alert has a linked runbook
- [ ] A cost report showing before/after savings

**Skills:** Incident troubleshooting, RCA, Release Management, Cost Optimization, Jira, Confluence, Agile

---

## 5. Skill Coverage Matrix

| Skill area | R1 | R2 | R3 | R4 | R5 |
|---|:-:|:-:|:-:|:-:|:-:|
| Linux / Bash / SSH | ✅ | ✅ | ✅ | | ✅ |
| Docker / Docker Hub | ✅ | | | | |
| ECR | | ✅ | ✅ | ✅ | |
| Ansible | ✅ | (opt: configure EC2) | | | |
| Jenkins | ✅ | | | (opt) | |
| GitHub Actions | | ✅ | | (opt) | |
| CodePipeline / Build / Deploy | | | ✅ | | |
| Terraform modules | | ✅ | | ✅ | |
| CloudFormation | | | ✅ | | |
| VPC / Subnets / NAT / SG / NACL / Route 53 / ELB | | ✅ | ✅ | ✅ | |
| EC2 / ASG / EBS / S3 | | ✅ | ✅ | | ✅ |
| EKS / HPA / Cluster Autoscaler | | | | ✅ | |
| CloudWatch | | ✅ | ✅ | ✅ | ✅ |
| Prometheus / Grafana / ELK | | | | ✅ | ✅ |
| SonarQube / GitLeaks / Trivy | ✅ | ✅ | ✅ | ✅ | |
| IAM / least privilege / Secrets | ✅ | ✅ | ✅ | ✅ | |
| Okta / SSO / SCIM / RBAC | | | | ✅ | |
| Python boto3 | | ✅ | | | ✅ |
| DB decision (RDS vs Mongo) | | ✅ | | | |
| Amazon Q / Copilot | | | ✅ | | |
| Incident / RCA / Release / Cost | | | | | ✅ |
| Git, PRs, Jira, Agile | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Not covered by this app:** **Maven** (Java build tool; this is a Node/npm app) and **Windows** servers. If you need these,
> we can add a small side-quest later (for example a tiny Java service, or a Windows jump host managed by Ansible over WinRM).

---

## 6. Definition of Done (applies to every task)

1. Code/config in Git, merged via a reviewed PR (ask Claude to "review my PR")
2. Jira ticket moved to Done with a short note on what you learned
3. Documented: what you built, **why** you chose it, how to run/destroy it
4. Cloud resources **destroyed** if not needed (cost discipline)
5. You can explain it out loud as if you were in an interview

---

## 7. Current Status

> Update this block at the end of every session.

- **Phase:** 0, Project Kickoff (Sprint 1 started 2026-10-13: Phase 0 stories + HT-16 Docker)
- **Done:**
  - HT-9 Jira setup: epics R1 to R5 + Phase 0, R1 stories HT-16, HT-21 to HT-27 with acceptance criteria
  - HT-10 dev handoff: `docs/06-devops/dev-handoff.md` v2. Dev fixed 6 of 11 issues (no in-memory DB fallback, `/health` checks DB, seed user from env, `VITE_API_URL` + `CORS_ORIGIN`). Merged in PR #1. Jira: move HT-10 to Testing (verify in HT-14)
  - GitHub: `master` protected (PR required, 0 approvals, no bypass, lock off), squash-only merging, auto-delete branches. Verified by a rejected direct push
- **In progress:** HT-13 branching strategy, on local branch `docs/HT-13-rewrite-branching-strategy` (**uncommitted**)
  - `docs/06-devops/branching-strategy.md`: sections 1 to 6 written and cleaned up ✅ (doc is final)
  - **Resume here:** `git status` → commit both files (`docs: rewrite branching strategy`), push, PR with What / Why / How to test, squash merge, clean up, Jira HT-13 → Done
- **Next up:** HT-14 run app locally. Needs a real MongoDB now (no fallback). Think: which tool makes that a one-liner? Also decide the Node version (Node 18 is EOL; server tests need Node 20+)
- **Open questions from the developer:** Option A (same domain + reverse proxy) or B (separate API domain) for R1? See handoff §7
- **Housekeeping:** fix the PR #1 title/description (still auto-generated and empty)
- **Blockers:** none
- **Cloud resources currently running:** none

---

## 8. Session Log

| Date | Session summary | Next step |
|---|---|---|
| 2026-10-13 | Roadmap created: 5 client requirements (R1 on-prem, R2 AWS+Terraform, R3 AWS-native, R4 EKS, R5 Ops) + Phase 0 kickoff | Start Phase 0.1: Jira setup |
| 2026-10-13 | Jira: epics, Phase 0 + R1 stories, Sprint 1 started. HT-10: dev handoff v2 + prod fixes merged (PR #1, merged without review). master protection added | Finish HT-13 (protection rules, merge strategy), then HT-14 run locally with real MongoDB |
| 2026-10-13 | Git fundamentals: push, PRs (#3 to #5), branch protection tested (bypass → enforced), squash-only + auto-delete, `-d` vs `-D` after squash, remote branch delete, `reset --soft/--hard`, `sed`. Learned: enforce rules in settings, not just docs; PR title = squash commit message | Finish HT-13 doc PR, then HT-14 |
