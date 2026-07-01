# Property Version Rename Design

## Objective

Rename the `PropertyVerificationVersion` domain model to `PropertyVersion`
throughout the application and database. The new name reflects that each
record is a complete version of a property that passes through the
verification workflow.

## Scope

The rename includes:

- `PropertyVerificationVersion` to `PropertyVersion`
- `PropertyVerificationVersionOtherDocument` to
  `PropertyVersionOtherDocument`
- `property-verification-version.entity.ts` to
  `property-version.entity.ts`
- `property-verification-version-other-document.entity.ts` to
  `property-version-other-document.entity.ts`
- `Property.currentVerificationVersion` to `Property.currentVersion`
- `Property.verificationVersions` to `Property.versions`
- `property_verification_version` to `property_version`
- `property_verification_version_other_document` to
  `property_version_other_document`
- `property_verification_version_user` to `property_version_user`
- `currentVerificationVersionId` to `currentVersionId`
- Associated indexes, primary keys, foreign keys, relation paths, imports,
  repository types, and application entity registration
- User-facing error or log text that says "property verification version"
  when it refers to the renamed entity

`PropertyVerificationStatus` remains unchanged because it describes the
verification workflow state and is still semantically accurate.

## Database Migration

A new reversible TypeORM migration will rename existing database objects in
place with PostgreSQL `ALTER ... RENAME` statements. It will not create
replacement tables or copy rows, so existing identifiers, timestamps,
relationships, and version history remain intact.

The migration's `up` method will:

1. Rename the three tables.
2. Rename `property.currentVerificationVersionId` to `currentVersionId`.
3. Rename affected primary-key constraints, foreign-key constraints, and
   indexes to use the `property_version` terminology.

The `down` method will perform the exact inverse operations in dependency-safe
order.

Previously committed migrations will remain unchanged. They represent the
schema history and may already be recorded as applied in deployed databases.

## Application Changes

Entity decorators will explicitly resolve to the renamed tables after the
migration. All TypeScript references will use the new class and relation
names. Existing version creation, review, merging, document copying, status
history, and current-version behavior will remain unchanged.

The property version service and its external workflows will retain their
current behavior. This work changes terminology and schema object names only;
it does not alter public request payloads or response DTOs. The renamed
`Property` relation fields are internal persistence-model properties.

## Compatibility and Failure Handling

The migration preserves data by renaming objects rather than reconstructing
them. Running `down` restores the previous names. Application code and the
migration must be deployed together because the renamed entities expect the
renamed database tables.

No temporary compatibility aliases will be introduced. Compile-time failures
from stale class or relation references are expected to expose incomplete
rename work.

## Verification

Verification will include:

- Search for stale non-historical `PropertyVerificationVersion`,
  `currentVerificationVersion`, and `verificationVersions` references
- Review generated SQL names against the current migration-defined schema
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e` when its required database and external dependencies are
  available
- Review both `up` and `down` migration ordering

Historical migration files are excluded from the stale-name requirement.
