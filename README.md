<p align="center">
  <h1 align="center">Verrify API - Backend Service</h1>
</p>

<p align="center">
  A robust backend application built with <a href="http://nodejs.org" target="_blank">Node.js</a> and <a href="https://nestjs.com/" target="_blank">NestJS</a> to support the Verrify platform.
</p>

## Description

Verrify API is the core backend service handling authentication, property and company verifications, payment processing, file management, and email notifications. 

### Key Technologies 🛠️
*   **Framework:** [NestJS](https://nestjs.com/) (v11)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database ORM:** [TypeORM](https://typeorm.io/) with PostgreSQL
*   **Authentication:** JWT, Role-Based Access Control (RBAC), and Google Auth
*   **Queueing:** RabbitMQ
*   **Emails:** NestJS Mailer with Pug templating
*   **Payments:** Paystack Integrations & Webhooks
*   **File Storage:** Cloudflare R2
*   **API Documentation:** Swagger / OpenAPI

## Installation

Ensure you have Node.js and npm installed.

```bash
# Clone the repository and install dependencies
$ npm install
```

## Environment Variables

Create a `.env` file in the root directory based on `.env.example` (if available) with the following essential keys:

```md
# Application
APP_PROFILE=dev
FRONTEND_HOST=http://localhost:3000
ORIGIN=http://localhost:3000

# Database (Postgres)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=verrify
DB_TYPE=postgres

# Email Sender
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USERNAME=username
EMAIL_PASSWORD=password
EMAIL_PROVIDER=smtp
EMAIL_REQUIRE_TLS=true
EMAIL_SENDER=noreply@verrify.net
ADMIN_EMAIL=admin@verrify.net

# Message Queue
RABBITMQ_URI=amqp://localhost:5672

# Security / Auth
JWT_SECRET=supersecret
JWT_EXPIRE=1h
REFRESH_EXPIRE=604800
VERIFICATION_EXPIRE=86400

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_PUBLIC_BUCKET=verrify-dev-public
R2_PRIVATE_BUCKET=verrify-dev-private
R2_PUBLIC_BASE_URL=https://files-dev.example.com
R2_PRESIGNED_URL_TTL_SECONDS=1800

PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
```

## Running the application

```bash
# development
$ npm run start

# watch mode (hot-reloading)
$ npm run start:dev

# production mode (runs migrations first)
$ npm run start:prod
```

## Database Migrations

TypeORM is used for managing database entities and migrations.

```bash
# Generate a new migration based on entity changes
$ npm run typeorm:migration-generate --name=MigrationName

# Create a blank migration file
$ npm run typeorm:migration-create --name=MigrationName

# Run pending migrations
$ npm run typeorm:migration-run

# Revert the last migration
$ npm run typeorm:migration-revert
```

## API Documentation

Once the application is running, the Swagger Interactive API Documentation can be accessed at:

```
http://localhost:<PORT>/docs
```

*(Assuming the default internal configuration maps Swagger to `/docs`)*

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Core Modules

*   **Auth Module:** Manages registration, login, JWT issuance, Google Auth, and 2FA.
*   **User Module:** Handles user profiles, permissions, and addresses.
*   **Property & Company Module:** Handles listing properties, articles, and submitting companies for verification.
*   **Verification Module:** Pipeline for Admin approval/rejection workflows assigning Verification Stages.
*   **Payment Module:** Generates orders and tracks external transactions via Paystack webhook listeners.
*   **Email Module:** Listens to RabbitMQ events and dispatches beautiful `.pug` styled transactional emails (Verification resets, Receipts, etc.).
*   **File Module:** Stores public media and private documents in Cloudflare R2, issuing short-lived URLs for private files.

## Cloudflare R2 Setup

Create separate public and private buckets for each environment, for example
`verrify-dev-public`, `verrify-dev-private`, `verrify-prod-public`, and
`verrify-prod-private`.

1. Connect each public bucket to its environment-specific custom domain. A
   development `r2.dev` URL may be used for local testing only.
2. Leave both private buckets without a custom domain and disable their
   `r2.dev` public development URLs.
3. Create a distinct Object Read & Write R2 API token for each environment and
   scope it only to that environment's public and private buckets.
4. Store `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` as secrets. Store the
   account ID, bucket names, public base URL, and signed URL TTL as environment
   variables.
5. Set `R2_PRESIGNED_URL_TTL_SECONDS` between `1200` and `2400` seconds.

Uploads continue to pass through the NestJS multipart endpoint, so browser
upload CORS rules are not required. Add public-domain CORS rules only when a
frontend needs cross-origin `fetch`, canvas, or similar access.

## License

This project is UNLICENSED and proprietary to the Verrify organization.
