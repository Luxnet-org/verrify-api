# Railway migration design

## Agreed outcome

Prepare this repository and a complete operator guide for deployment on Railway.
The user will provision services, restore the database, deploy, and change DNS.
Codex will not create Railway resources or modify the running deployment.

- Railway builds the application's Dockerfile from `master` after GitHub checks pass.
- PostgreSQL and RabbitMQ run as separate Railway services with persistent volumes.
- RabbitMQ starts fresh; existing messages and broker state are not migrated.
- Restore exactly `2026-09-29T23-00-00-351Z.sql.gz` before starting the application.
- Existing Cloudflare R2 buckets, credentials, stored objects, and public domains remain in use.
- Upgrade to NestJS 12.1+ and replace direct AWS SDK storage integration with `@nestjs/storage`.
- Remove Dokploy deployment automation and its obsolete production configuration.

## Deployment architecture

Use Railway's Dockerfile builder for the API. Keep the multi-stage build,
production-only runtime dependencies, template assets, and non-root runtime user.
Set the Railway pre-deploy command to `npm run typeorm:migration-run:prod`,
and the application command to `node dist/main.js`. Migration failure must
prevent the release from starting. Railway owns deployment readiness: remove
custom health polling/retries and the Dockerfile `HEALTHCHECK`. Do not declare
healthcheck settings in the repository's Railway config. The operator guide
will explain configuring Railway's native healthcheck in its dashboard using
the existing `/api/v1/health` endpoint. Railway only probes an HTTP endpoint
when a healthcheck path is configured; it does not infer application readiness
or continuously monitor that endpoint after deployment.

Listen on Railway's `PORT` on all container interfaces, enable Nest shutdown
hooks, and let Railway manage the container lifecycle. Application
logs go to standard output/error; the current file logging calls are disabled.
Remove the requirement for a mounted log directory from deployment instructions.

The guide will configure one API replica initially because this application
contains scheduled payment reconciliation. Increasing replicas requires reviewing
the scheduled work's coordination separately.

GitHub Actions becomes a validation workflow for pull requests and pushes to
`master`: install the lockfile, lint without automatic fixes, run existing unit tests,
and compile TypeScript. Railway builds the deployment image; GitHub Actions
must not build the same image again. Railway's **Wait for CI** setting is
enabled before autodeploys. Remove Docker Hub pushes, Dokploy API calls, and
deployment secrets from the workflow. Retain local-development Compose.

## Automation delegated to Railway

This inventory covers every deployment automation file in the repository and
the external VPS backup job referenced by the current deployment guide.
No replacement shell/JavaScript deployment coordinator will be introduced.

| Existing automation/configuration | Change | Railway capability or remaining responsibility |
| --- | --- | --- |
| `scripts/deploy-dokploy.mjs` | Delete the entire script. | GitHub source integration and native deployment lifecycle. |
| Dokploy target checks, API token handling, Compose upload, and deployment trigger inside that script | Delete with the script. | The operator links the correct repository, branch, and service in Railway. |
| Compose image/release placeholder substitution and migration release labels | Delete with the script and production Compose files. | Railway builds the connected source revision and records each deployment. |
| Deployment-ID tracking, status polling, timeout loops, and custom deployment locks | Delete with the script. | Native deployment status, logs, and release management; no custom coordinator. |
| Public health fetch/retry loop (`verifyPublicHealth`) | Delete with the script. | Optional native HTTP healthcheck configured in Railway's dashboard. |
| `scripts/deploy-dokploy.test.mjs` | Delete. | Tests exercise deleted Dokploy-specific code and have no replacement deployment script. |
| `scripts/compose-environment.test.mjs` | Delete. | Railway service variables/references replace production dotenv/Compose rendering; keep application configuration validation. |
| CI `build-push` job: Buildx, Docker Hub login, image tags, image push, and image cache configuration | Remove from `.github/workflows/CICD.yml`. | Railway builds/stores the deployment image from the Dockerfile. |
| CI `deploy` job: `git ls-remote` master-head guard, Dokploy API invocation, deployment credentials, and release timeout | Remove from the workflow. | Railway GitHub autodeploy with **Wait for CI**, connected to `master`. |
| CI `node --test scripts/*.test.mjs` | Remove. | Obsolete deployment tests are deleted; existing source unit checks remain. |
| CI production deployment concurrency group | Remove; use CI-only cancellation/grouping if useful. | GitHub Actions no longer coordinates production releases. |
| Dockerfile `HEALTHCHECK` and production Compose healthcheck commands | Remove from the production flow. | Railway's native healthcheck; local-development dependency checks can remain. |
| `docker-compose.dokploy.yaml` and `docker-compose.production.yaml`, including `depends_on`, `--wait`, private bridge networks, host ports, and restart orchestration | Delete both production files. | Independent Railway services, private networking, volumes, service settings, and restart policies. |
| One-shot production Compose `migrate` service and recreation label | Remove with Compose; keep the TypeORM migration command. | Railway's pre-deploy hook executes that command and blocks failed releases. |
| `.env.dokploy.example`, outdated `.env.production.example`, and `docs/DOKPLOY_DEPLOYMENT.md` | Replace with Railway variable checklist and guide. | Native service variables and reference variables; no generated secret files. |
| Production `/logs` directory, mounted logs volume, and unused file logging helper | Remove production file-logging plumbing. | Railway captures standard output/error and exposes service logs. |
| VPS reverse-proxy/TLS setup referenced in existing code/docs | Remove deployment dependence on that proxy; document Railway domains. | Railway public routing and managed TLS; the operator still sets DNS. |
| External `/home/verrify/scripts/backup_verrify.sh` and its daily VPS backup schedule, referenced in `docs/DOKPLOY_DEPLOYMENT.md` | Document retirement on the old VPS after cutover; the script is not in this repository. | Railway scheduled volume backups can cover volume recovery. They do not replace portable SQL exports to R2 if those are still wanted. Do not remove an external backup job automatically. |

Railway schedules and executes processes; it does not implement application
behavior. Keep TypeORM migration definitions and their CLI commands, the
September 29 backup inspection/restore procedure, GitHub lint/tests/type checking,
RabbitMQ queue declarations and reconnect/retry logic, R2 upload/access rules,
and the existing payment reconciliation job. Native backups require explicit
configuration and do not import the supplied `.sql.gz` archive. Deployment
rollback does not undo database migrations. DNS cutover and application smoke
checks remain operator steps, not a new automation script.

## Database and exact backup restore

PostGIS is required by existing geometry columns and spatial queries. Use a
PostGIS-capable image/template rather than Railway's plain PostgreSQL template.
The backup has not been supplied to this workspace: its PostgreSQL version,
PostGIS version, dump format, ownership statements, and migration history are
not known. The operator guide must make inspecting those facts a prerequisite
to selecting the image or restoring anything. It must not infer them from the
filename or from the repository's old Compose images.

The restore guide will:

1. Validate the gzip archive and inspect dump metadata locally without printing
   application data or credentials into logs.
2. Select a compatible PostgreSQL/PostGIS image and its correct persistent
   volume location based on the dump and image documentation.
3. Create an empty target database and keep the API undeployed while restoring.
4. Distinguish a compressed plain SQL dump from a compressed custom-format dump;
   use `psql` with stop-on-error or `pg_restore` accordingly.
5. Explain how to resolve source role/ownership requirements without blindly
   rewriting the SQL or ignoring restore failures.
6. Verify PostGIS, restored tables, representative row counts, and TypeORM
   migration history. Do not run the baseline against existing tables or
   fabricate migration-history entries to suppress errors.
7. Run only genuinely pending migrations against the restored schema, then
   deploy the API and verify login, spatial queries, uploads, private downloads,
   and message delivery before changing the public domain.

The guide must distinguish restoring the September 29 data snapshot from
applying subsequent schema migrations required by the current application.
It must not instruct importing data from a newer backup or deleting R2 objects.

API-to-database traffic uses Railway private networking and referenced database
variables. Operator restore connections use an explicitly configured local tunnel
or TCP proxy. Public access details and SSL requirements must be verified for the
chosen service, not copied from private-network settings.

Correct the existing TypeORM CLI port parsing so a decimal port is parsed with
radix 10 and uses 5432 only as the fallback.

## Fresh RabbitMQ service

Run RabbitMQ with a persistent volume and a stable node identity. Configure
non-default credentials and use the private Railway hostname in the application's
AMQP URI. Explain URI encoding for credentials containing reserved characters.
The existing application declares its durable queues and exchanges; no old
messages or broker definitions are imported. Document management access separately
from the private AMQP connection and verify connectivity during setup.

## NestJS 12 and R2 storage

Upgrade core/platform/testing packages together to a compatible NestJS 12.1+
release and select compatible releases of the companion Nest integrations.
Do not suppress peer-dependency conflicts with `--force` or legacy resolution.
Use Node.js 24.15+ in the container, CI, and local toolchain documentation;
retain CommonJS, upgrade Jest to 30, and update the TypeScript/Jest transforms
as required by the selected compatible package versions. Upgrade Joi to 18+
and adapt `validationOptions.libraryOptions` for Nest's config module.

Register `@nestjs/storage` with two named `S3Disk` instances: public media and
private documents. Supply the existing R2 endpoint, region `auto`, credentials,
bucket names, and public base URL through the existing R2 environment variables.
Use its storage and URL APIs instead of constructing AWS SDK commands or signing
requests manually. Remove the direct AWS SDK dependencies once unused.

Retain the existing multipart upload endpoint, file-type/size validation,
public/private file classification, object-key convention, metadata, cache
headers, and response shape (`fileId`, `url`, `expiresAt`). Uploads continue
through the API and are validated before writing to storage. Avoid introducing
direct browser uploads or a frontend/API contract change in this migration.

Existing database file records must keep resolving correctly: public R2 URLs,
private bucket/key downloads with the configured TTL, and legacy Cloudinary
URLs. The storage refactor must not move files, rename existing objects, or
change database file metadata. Keep only the small application-specific glue
needed to select disks and preserve that behavior.

## Repository deliverables

- Compatible dependency manifest and lockfile, Node toolchain declaration,
  config validation, and NestJS runtime/test adjustments.
- `@nestjs/storage` module configuration and file-service integration.
- Railway config file declaring Docker build and migration command. Configure
  native healthchecks and restart behavior in Railway's dashboard, without
  custom monitoring or restart scripts.
- Updated Dockerfile and Docker ignore rules; backup archives excluded from
  source control and container build context.
- GitHub validation workflow without Dokploy or Docker Hub deployment steps.
- Railway environment-variable example with references and secret placeholders.
- `docs/RAILWAY_DEPLOYMENT.md` with provisioning, exact restore, environment
  wiring, CI gating, verification, domain cutover, and rollback instructions.
- README updates; removal of Dokploy scripts/tests, Dokploy Compose/example/docs,
  and the obsolete production Compose flow superseded by Railway.

Actual Railway project IDs, region, hostnames, credentials, public API domain,
and backup path are operator inputs in the guide. They will not be invented.
Rollback keeps the old deployment available until verification; repository
cleanup does not delete running services, volumes, or external secrets.

## Verification

New regression and isolated HTTP tests are deferred at the user's request.
Keep the existing unit tests and restore the starter e2e test unchanged. Do
not run that starter test in CI: it imports the full production module and
expects a starter response.

Run existing unit tests, lint on changed files, TypeScript compilation,
dependency compatibility checks, and a local production Docker build as
implementation validation only. Do not add a recurring duplicate Docker build
to GitHub CI. Verify compiled migration loading in the runtime image. Checks
must not require production credentials or mutate the user's database.
Deployment success cannot be claimed from repository checks.

## Sources

- [NestJS 12 migration guide](https://docs.nestjs.com/migration-guide)
- [NestJS storage](https://docs.nestjs.com/application/file-storage)
- [Railway GitHub autodeploy controls](https://docs.railway.com/deployments/github-autodeploys)
- [Railway pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command)
- [Railway PostgreSQL extensions](https://docs.railway.com/databases/postgresql#extensions)
- [Railway configuration reference](https://docs.railway.com/config-as-code/reference)
- [Railway native healthchecks](https://docs.railway.com/deployments/healthchecks)
- [Railway scheduled volume backups](https://docs.railway.com/volumes/backups)
