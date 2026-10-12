# Frontend API changes: verification attachments and additional information

All paths include the existing `/api/v1` prefix. Send the existing bearer token and JSON request bodies to the verification endpoints.

## Endpoints with changed request bodies

| Method | Endpoint                                       | Success status | Changes                                                                                                    |
| ------ | ---------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| POST   | `/api/v1/verification/initiate`                | 201            | Replace `verificationFileIds` with `fileAttachments`; optionally send `additionalInformation`.             |
| PATCH  | `/api/v1/verification/{verificationId}/update` | 200            | Replace `verificationFileIds` with `fileAttachments`; optionally replace or clear `additionalInformation`. |

`verificationFileIds` has been removed from these two request DTOs. Sending it now produces a validation error because unknown request properties are rejected. Migrate both frontend payload builders before using this backend version.

## File attachments

Upload each file using the existing endpoint, then submit its returned `fileId` with a label:

```http
POST /api/v1/file/upload
Content-Type: multipart/form-data

file: <binary>
fileInfo: VERIFICATION_DOCUMENT
```

The upload contract is unchanged. Use `VERIFICATION_DOCUMENT` for files attached to a user verification request. Files uploaded with a different file type cannot be linked as verification documents.

The new optional request field is:

```ts
fileAttachments?: Array<{
  label: string;
  fileId: string;
}>;
```

Each attachment requires a non-empty string label and a valid UUID file ID. Labels are trimmed before storage. Do not send `url` in an attachment request; it is a response field. Each file must exist and must not already be associated with a verification request.

On update, attachments are added to the verification's existing files. The array does not replace or remove previously attached files. Omission or an empty array leaves attachments unchanged. Send only newly uploaded, unlinked files, rather than resubmitting the attachment list returned by the API.

## Additional information

Both initiate and update requests accept:

```ts
additionalInformation?: Record<string, unknown> | null;
```

The top-level value must be a JSON object or `null`; arrays, strings, numbers, and booleans are not accepted as the top-level value. Object contents can include nested objects, arrays, and other JSON values. There is no fixed set of object keys.

| Request value | Initiate behavior      | Update behavior                                    |
| ------------- | ---------------------- | -------------------------------------------------- |
| Omitted       | Stored as `null`       | Preserves existing information                     |
| JSON object   | Stores the object      | Replaces the entire existing object                |
| `{}`          | Stores an empty object | Replaces existing information with an empty object |
| `null`        | Stored as `null`       | Clears existing information                        |

Updates do not merge objects. To retain previous keys, include them in the object you submit. This field is accepted only by the initiate and update request endpoints; admin verdict and stage-advance request bodies do not accept it.

## Example requests

Initiate verification for an existing property:

```http
POST /api/v1/verification/initiate
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "propertyId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "fileAttachments": [
    {
      "label": "Survey plan",
      "fileId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    }
  ],
  "additionalInformation": {
    "contactPhone": "+2348000000000",
    "notes": "Please contact the owner before visiting.",
    "inspection": {
      "preferredDays": ["Monday", "Wednesday"]
    }
  }
}
```

For a new property, omit `propertyId` and provide the existing required fields `name`, `polygon`, and `propertyType`. Existing property fields and their validation rules are otherwise unchanged.

Update the dynamic information without adding files:

```http
PATCH /api/v1/verification/{verificationId}/update
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "additionalInformation": {
    "contactPhone": "+2348111111111",
    "notes": "Inspection can be scheduled for Friday."
  }
}
```

To clear it, send:

```json
{
  "additionalInformation": null
}
```

The existing update restriction still applies: the request must belong to the current user and remain in the `INITIATED` stage.

## Verification response changes

The shared verification response now includes:

```ts
additionalInformation: Record<string, unknown> | null;
fileAttachments: Array<{
  fileId: string;
  label: string | null;
  url: string;
}>;
verificationFiles: string[]; // Existing URL array remains available.
```

`label` can be `null` for files uploaded through the older unlabeled flow. Render a suitable fallback label for these records. Private file URLs can expire; refresh the verification resource to obtain fresh URLs rather than treating them as permanent file identifiers.

This is an example of the changed fields in an initiate response, with other existing verification fields omitted:

```json
{
  "success": true,
  "message": "SUCCESS!",
  "status": 201,
  "data": {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "stage": "INITIATED",
    "additionalInformation": {
      "contactPhone": "+2348000000000"
    },
    "fileAttachments": [
      {
        "fileId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        "label": "Survey plan",
        "url": "https://example.com/document-download"
      }
    ],
    "verificationFiles": ["https://example.com/document-download"]
  }
}
```

The shared response shape applies to initiate, update, submit, verification detail, user lists, and admin verification responses. List items are located at `response.data.data`; pagination metadata remains at `response.data.meta`. Attachment arrays reflect files loaded for that endpoint; some action responses do not load file relations. Use the verification detail endpoint to refresh attachment state.

Useful read endpoints are unchanged:

| Method | Endpoint                                |
| ------ | --------------------------------------- |
| GET    | `/api/v1/verification/{verificationId}` |
| GET    | `/api/v1/verification/my-requests`      |
| GET    | `/api/v1/admin/verification/list`       |

## Other contracts and rollout

Property and sub-property `otherDocuments` payloads keep the same `{ label, fileId }` shape. Renaming their shared backend DTO to `FileAttachmentRequestDto` does not require frontend payload changes.

The admin stage-advance endpoint still accepts its existing `verificationFileIds` array for admin report files. Its request contract has not changed.

The backend release includes migration `AddPropertyVerificationAdditionalInformation1781000000014`, which adds the nullable JSONB column. Apply this migration before serving the updated API. No new environment variables are required.
