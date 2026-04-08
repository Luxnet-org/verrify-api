# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the NestJS application. Keep HTTP entrypoints in `src/controller/`, business logic in `src/service/`, persistence models in `src/model/`, shared decorators and guards in `src/common/`, and database config and migrations under `src/config/` and `src/database/migrations/`. Email templates live in `src/templates/`. End-to-end tests are in `test/`, and operational notes belong in `docs/`.

## Build, Test, and Development Commands
Install dependencies with `npm install`. Use `npm run start:dev` for local development with file watching, `npm run build` to compile into `dist/`, and `npm run start:prod` to run pending TypeORM migrations before booting the server. Quality checks:

- `npm run lint`: run ESLint with auto-fixes for `src/` and `test/`
- `npm run format`: apply Prettier to TypeScript files
- `npm run test`: run unit tests
- `npm run test:e2e`: run end-to-end tests from `test/`
- `npm run test:cov`: generate coverage output in `coverage/`
- `npm run typeorm:migration-run`: apply pending migrations

## Coding Style & Naming Conventions
This codebase uses TypeScript with Prettier and `typescript-eslint`. Follow the existing 2-space indentation, single quotes, and trailing-comma behavior produced by Prettier. Name controllers and services as `*.controller.ts` and `*.service.ts`; DTOs, requests, and responses belong under `src/model/` with explicit suffixes such as `register-request.dto.ts` or `auth-response.dto.ts`. Prefer PascalCase for classes and enums, camelCase for methods and properties, and kebab-case only for migration filenames.

## Testing Guidelines
Jest is used for unit and e2e testing, with `ts-jest` for TypeScript transforms. Place unit specs beside the source as `*.spec.ts`; keep API-level flows in `test/*.e2e-spec.ts`. Cover new service logic, validation rules, and failure paths. Run `npm run test` and `npm run test:e2e` before opening a PR; use `npm run test:cov` when making broader changes.

## Commit & Pull Request Guidelines
Recent history favors concise, imperative commits, usually with Conventional Commit prefixes such as `feat:` and `fix:`. Keep subjects specific, for example: `fix: correct password reset token type check`. PRs should describe the behavior change, note any migration or env var impact, link the issue when applicable, and include sample request/response payloads or Swagger screenshots for API-facing changes.

## Security & Configuration Tips
Keep secrets in `.env`; never commit credentials or live keys. Validate changes to CORS, JWT, payment, email, Cloudinary, and RabbitMQ settings before merging. When schema changes are required, commit the matching migration in `src/database/migrations/` with the code that depends on it.
