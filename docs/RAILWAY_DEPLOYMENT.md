# Railway deployment

This guide moves the API, PostgreSQL/PostGIS, and a fresh RabbitMQ broker to
Railway. R2 keeps the existing public/private buckets, objects, credentials,
and public domain. You perform provisioning, the backup restore, deployment,
and DNS changes. The repository does not contain a deployment coordinator.
See [the complete automation inventory](RAILWAY_MIGRATION_DESIGN.md#automation-delegated-to-railway)
for every removed deployment script and its Railway replacement.

## Before provisioning

Use Node **24.21.0** (`nvm install && nvm use`), npm, a Railway account with
GitHub repository access, and PostgreSQL client tools compatible with the dump.
Keep the old deployment available until the Railway installation is verified.
Do not connect the API source or enable autodeploy before the restore completes:
the first deployment runs pending migrations automatically.

The initial data source is exactly `2026-09-29T23-00-00-351Z.sql.gz`. Restoring
it recovers that snapshot's records, not subsequent writes. Applying pending
schema migrations afterwards makes that snapshot usable by the current code.

The backup's contents and source versions have not been inspected for you.
Determine them below before choosing a PostGIS image. Railway's standard
PostgreSQL template does not include PostGIS; this application uses geometry
columns and spatial queries. [Railway PostgreSQL extensions](https://docs.railway.com/databases/postgresql#extensions)

## 1. Inspect the supplied backup locally

Use a private directory outside the Git checkout. These are commands for your
terminal, not scripts to commit or an operation to run on the old database.

```bash
umask 077
BACKUP='/absolute/path/2026-09-29T23-00-00-351Z.sql.gz'
gzip -t "$BACKUP"
RESTORE_FILE=$(mktemp)
gzip -dc "$BACKUP" > "$RESTORE_FILE"
file "$RESTORE_FILE"
```

Stop if decompression fails. `file` should identify SQL text or a PostgreSQL
custom archive. A `.sql.gz` filename does not prove the format.

For **plain SQL**, inspect only metadata, not application records:

```bash
rg '^-- Dumped (from database|by pg_dump) version' "$RESTORE_FILE"
rg -n '^(CREATE DATABASE|\\connect|CREATE ROLE|ALTER .* OWNER TO|GRANT |REVOKE |CREATE EXTENSION)' "$RESTORE_FILE"
```

For a **custom archive**:

```bash
pg_restore --list "$RESTORE_FILE" > restore-toc.txt
rg '^;.*(Dumped from|Dumped by|Dump Version)' restore-toc.txt
pg_restore --schema-only --file=restore-schema.sql "$RESTORE_FILE"
rg -n '^(CREATE DATABASE|CREATE ROLE|ALTER .* OWNER TO|GRANT |REVOKE |CREATE EXTENSION)' restore-schema.sql
```

Keep these files private too. Use a `pg_restore` at least as new as the tool
that produced the archive. Select a PostgreSQL target at the same major as the
source, or a newer major whose restore you have verified; do not assume a dump
can be restored to an older server. Determine the source PostGIS version from
the source database (`SELECT postgis_full_version();`) or backup metadata if
available. If that version is unavailable, verify a restore with the chosen
extension version before cutover; the filename cannot establish compatibility.
[PostgreSQL restore documentation](https://www.postgresql.org/docs/current/app-pgrestore.html)

Check whether the dump creates/reconnects to a named database, requires source
roles, or contains objects owned by those roles. Resolve these requirements
before import. Do not strip SQL statements with search/replace or continue past
restore errors. The plain-SQL command in section 4 assumes a single-database
dump without `CREATE DATABASE` or `\connect`. If that assumption does not match
the inspected file, restore its intended database in an isolated target cluster
with the matching roles instead of using that command unchanged.

## 2. Create persistent database and broker services

Create one Railway project/environment. Use these service names, or adjust
every variable reference to match your chosen names exactly: `Postgres`,
`RabbitMQ`, and `api`. Choose your region in Railway; no region is prescribed
by the repository.

### Postgres

Use a PostGIS template whose image you inspect, or create a Docker-image service
using a compatible `postgis/postgis:<postgres-major>-<postgis-version>` tag.
Pin the image you verify. Do not use the old VPS-only image names in deleted
Compose files. Configure:

| Variable | Value |
| --- | --- |
| `POSTGRES_USER` | New target administrator role |
| `POSTGRES_PASSWORD` | New strong secret |
| `POSTGRES_DB` | Bootstrap database, e.g. `postgres` |
| `PGDATABASE` | Name of the application database you will create/restore |

For a custom image, add connection variables if your selected template does not
already provide them: `PGHOST=${{RAILWAY_PRIVATE_DOMAIN}}`, `PGPORT=5432`,
`PGUSER=${{POSTGRES_USER}}`, and `PGPASSWORD=${{POSTGRES_PASSWORD}}`.
Do not assume a custom image automatically receives template connection URLs.

Attach a volume before starting the database. Follow the selected image's
documented `PGDATA` and volume path. With standard PostGIS Debian images based
on PostgreSQL **17 and earlier**, the default data mount is
`/var/lib/postgresql/data`. With PostgreSQL **18+**, it is
`/var/lib/postgresql`, with version-specific `PGDATA` beneath it. Inspect any
template overrides rather than copying a path from another version.
[PostGIS image documentation](https://github.com/postgis/docker-postgis),
[PostgreSQL image storage changes](https://hub.docker.com/_/postgres)

Wait for the database to be running and inspect its logs. Keep the API undeployed.
Create an empty application database from `template0`, owned by the intended
application role, using the connection established in section 3. The PostGIS
image may initialize extensions in its bootstrap database; using a separate
empty application database avoids collisions with objects in the dump.
For example, **replace the identifiers before executing**:

```sql
CREATE DATABASE "your_application_database"
  WITH TEMPLATE template0 OWNER "your_target_role";
```

If the plain SQL dump includes ownership/GRANT statements for other source
roles, either create the required roles with appropriate privileges before
restore or have the backup prepared for the intended role. A custom archive
can use `--no-owner --no-privileges` when you deliberately choose target-role
ownership. This does not solve absent roles referenced by application code or
other SQL expressions.

### RabbitMQ

Create a Docker-image service using the official `rabbitmq:4-management` image
(pin the verified image for production), with a volume at `/var/lib/rabbitmq`.
Set `RABBITMQ_DEFAULT_USER` and `RABBITMQ_DEFAULT_PASS` to new credentials.
Set `RABBITMQ_NODENAME=rabbit@localhost` so node identity survives changing
container hostnames when its data volume is reused. Configure Railway's native
restart policy for both database and broker in their service settings.
[RabbitMQ container configuration](https://github.com/docker-library/docs/tree/master/rabbitmq)

Use the private hostname and AMQP port **5672** for API traffic. Ensure the
broker listener supports the private network address family used by your
project. Do not expose AMQP or management port 15672 publicly by default.
If you need the management UI, arrange authenticated temporary access through
a tunnel or separately configured route. Start fresh: import no old definitions
or messages. The application declares its durable queues and exchanges.

## 3. Establish an operator database connection

For templates with the required connection configuration, Railway CLI can hold
a local private tunnel (use actual project/environment/service identifiers):

```bash
railway login
railway connect Postgres --tunnel-only --port 15432 \
  --project '<project-id>' --environment '<environment-name>'
```

Keep that terminal open. Use the local connection details printed by Railway,
including the credentials and port; don't publish its output. For a custom
service, ensure its connection configuration is compatible with the CLI first.
If you instead configure a temporary public TCP proxy, use its actual assigned
host/port and confirm server TLS support; a plain PostGIS image does not enable
TLS just because Railway exposes a TCP port. Remove temporary public access
afterward. Prefer the private tunnel for restore.
[Railway database connections](https://docs.railway.com/cli/connect),
[Railway TCP proxy](https://docs.railway.com/networking/tcp-proxy)

In your restore terminal, supply local connection settings without putting a
password literal in command history:

```bash
export PGHOST=127.0.0.1
export PGPORT=15432
export PGUSER='your_target_role'
export PGDATABASE='your_application_database'
read -r -s -p 'Database password: ' PGPASSWORD
printf '\n'
export PGPASSWORD
```

This snippet uses Bash (`read -s -p`); use your shell's silent-password prompt
equivalent if necessary. Set `PGSSLMODE` to match the actual connection's TLS
configuration. Do not copy private-network `DB_SSL=false` to an unrelated
public connection or guess that TLS is available.

Connect to the bootstrap database first if you still need to create the empty
target database. Verify the target has no application tables before restoring:

```bash
psql -X --set=ON_ERROR_STOP=1 --command="SELECT version();"
psql -X --set=ON_ERROR_STOP=1 --command="SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

Stop if the target contains existing application data. Do not drop tables or
restore over a populated database as an automatic retry.

## 4. Restore the September 29 snapshot

For the inspected single-database **plain SQL** dump:

```bash
psql -X --set=ON_ERROR_STOP=1 --file="$RESTORE_FILE"
```

For the inspected **custom archive**, with target-role ownership deliberately
chosen as described above:

```bash
pg_restore --exit-on-error --no-owner --no-privileges \
  --dbname="$PGDATABASE" "$RESTORE_FILE"
```

Do not use `--clean`, ignore errors, or invent source role mappings. If an import
fails, investigate its first error. Prepare a new empty target for retry;
coordinate any deletion yourself. The source backup remains unchanged.

After a successful restore, verify extensions, records, and migration history:

```sql
SELECT extname, extversion FROM pg_extension
  WHERE extname IN ('postgis', 'uuid-ossp');
SELECT postgis_full_version();
SELECT count(*) FROM "users";
SELECT count(*) FROM "property";
SELECT count(*) FROM "file";
SELECT to_regclass('public.migrations');
```

Compare counts and representative records with the supplied snapshot's known
contents. If `migrations` exists, inspect its rows (`SELECT * FROM migrations
ORDER BY timestamp;`). Compare that history with the repository migrations.
Do not execute the baseline against an existing schema or insert fabricated
history entries. If history is absent or inconsistent, audit the restored
schema and establish a correct baseline before deploying the application.

With Node 24 and dependencies installed, inspect pending migrations locally
through the tunnel without loading unrelated production credentials:

```bash
npm ci
npm run build
export APP_PROFILE=prod DB_TYPE=postgres
export DB_HOST="$PGHOST" DB_PORT="$PGPORT"
export DB_USERNAME="$PGUSER" DB_PASSWORD="$PGPASSWORD" DB_NAME="$PGDATABASE"
# Set DB_SSL to match this operator connection, not the API's private connection.
npm run typeorm:migration-show:prod
```

Each pending migration must correspond to a change absent from the restored
schema. When the history is verified, the first Railway API deployment will
execute those migrations through its pre-deploy hook. A failed hook blocks
that release. Don't run a second migration process concurrently.
[Railway pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command)

## 5. Configure the API and enable Railway deployment

After review, merge the prepared repository changes into **master**, push them
to GitHub, and require the checks to pass. Create/link `api` to that **master**
branch after the restore and migration-history check. Railway reads `railway.json` and the Dockerfile:

- Dockerfile builder; multi-stage Node 24 image, production dependencies,
  templates, compiled migrations, and a non-root runtime user.
- Pre-deploy: `npm run typeorm:migration-run:prod`.
- Start: `node dist/main.js`; bind all interfaces using Railway's `PORT`.
- No Docker HEALTHCHECK, custom health script, deploy polling, or registry push.

Use [.env.railway.example](../.env.railway.example) as the complete variable
checklist in Railway's **Variables** tab. It is documentation, not a production
dotenv file or a file to upload with real secrets. References are case-sensitive:

| API variable | Value for the service names in this guide |
| --- | --- |
| `APP_PROFILE` / `NODE_ENV` | `prod` / `production` |
| `DB_TYPE` | `postgres` |
| `DB_HOST` | `${{Postgres.RAILWAY_PRIVATE_DOMAIN}}` |
| `DB_PORT` | `5432` |
| `DB_USERNAME` | `${{Postgres.POSTGRES_USER}}` |
| `DB_PASSWORD` | `${{Postgres.POSTGRES_PASSWORD}}` |
| `DB_NAME` | `${{Postgres.PGDATABASE}}` (the restored application DB) |
| `DB_SSL` | `false` for the documented plain private PostGIS connection; adjust if you configured DB TLS |
| `RABBITMQ_URI` | `amqp://<encoded-user>:<encoded-password>@<broker-private-host>:5672` |

Use the broker's actual Railway private hostname. URI-encode its username and
password separately, not the entire URI. With credentials limited to URI-safe
characters, references can be used directly; reserved characters such as `@`,
`:`, `/`, `%`, `#`, and `?` require encoding before composing the URI. Do not
assume interpolation performs URL encoding.

Copy the existing JWT, R2, Google, Paystack, and email settings from your secret
store to Railway; do not commit them. Preserve the existing Google private-key
representation expected by the application. Set actual frontend origins and
hostnames. Pick either SMTP or Resend and fill the corresponding required keys.
No local file-log path or application volume is needed: R2 holds files and
Railway collects console logs.

In the API service dashboard:

1. Enable **Wait for CI** and ensure Railway has the required GitHub permissions.
   CI runs existing unit tests and the build, and checks lint on changed TypeScript files;
   the known pre-existing full-repository lint backlog is outside this migration.
2. Use **one replica** initially because payment reconciliation runs in-process.
3. Configure the native restart policy according to your operational preference.
4. For native HTTP readiness checks, set the dashboard healthcheck path to
   `/api/v1/health`. Railway does not infer it or continuously monitor it after
   deployment. The repository deliberately contains no custom checking logic.
5. Configure a Railway-generated domain for verification; then enable deployment.
   Follow that deployment's status and logs in Railway and require a successful
   deployment and successful migrations before proceeding.

[GitHub autodeploy / Wait for CI](https://docs.railway.com/deployments/github-autodeploys),
[native healthchecks](https://docs.railway.com/deployments/healthchecks),
[Dockerfile builds](https://docs.railway.com/builds/dockerfiles)

## 6. Verify and change the public domain

Before changing DNS, verify on the generated Railway domain: health response,
Swagger, login using a restored user, existing property queries including
spatial search, a public media upload, a private document upload/download and
URL expiry, an existing legacy file URL, and a RabbitMQ-backed email flow.
Use the intended email/payment environment for smoke checks. Check that the
fresh broker has the expected exchanges/queues and that messages are consumed.

Add your actual API domain to Railway and apply exactly the DNS records it
supplies. Railway handles HTTP routing and TLS for configured public domains;
remove dependence on the old VPS proxy. If an additional proxy such as Cloudflare
sits in front of the API, review Express trust-proxy/client-IP handling before
using it for rate limits. The API retains the existing one-hop trust setting;
don't silently enable trust of arbitrary forwarded headers.
[Railway domains](https://docs.railway.com/networking/domains)

After cutover, verify traffic, webhook delivery, CORS, and application logs.
Keep the old deployment available until these checks are satisfactory; stop its
write traffic and scheduled work when switching to Railway to avoid two active
production backends. Do not copy post-September-29 data into the target as part
of this agreed restore.

## Operations and cleanup

- Use Railway's native deployment history, redeploy/rollback actions, logs,
  metrics, restart policies, and service variables. A code rollback does not
  reverse database migrations; assess schema compatibility before rollback.
- Configure scheduled volume backups in Railway for the database and broker.
  These snapshots are distinct from portable SQL dumps or exports to R2.
  Preserve SQL-to-R2 exports separately if you still need them.
- After verification, retire Dokploy/Docker Hub deployment secrets and variables
  in GitHub, old VPS reverse-proxy configuration, and the old deployment trigger.
  The repository changes do not delete those external resources.
- The old guide references `/home/verrify/scripts/backup_verrify.sh`; it is not
  in this repository. Retire its VPS schedule only after your Railway backup
  policy is configured and verified. Do not delete existing backup archives.
- Keep the local-development `docker-compose.yml` for PostGIS, RabbitMQ, and
  MailHog. Application migrations, message retries, and scheduled business logic
  remain application responsibilities.
- Close restore tunnels, remove temporary public DB access, unset exported
  database credentials, and securely remove your temporary decompressed files
  once verification is complete. Keep the original gzip backup privately.

[Railway volume backups](https://docs.railway.com/volumes/backups),
[deployment actions](https://docs.railway.com/deployments/actions)
