# Nearby Property Search API

Consumer guide for searching properties by longitude, latitude, and radius. This draft reflects the current backend implementation and the frontend coordinate sources you described.

**Endpoint:** `GET /api/v1/property/point`

**Authentication:** `Authorization: Bearer <access-token>`

**Success:** HTTP 200 with a paginated property list.

## What the search does

The endpoint returns properties whose stored location polygon lies within the requested radius of a geographic point. Supply the point as separate `longitude` and `latitude` query parameters and the search distance in `radiusKm`. The server converts kilometres to metres for its spatial query, sorts matches by ascending distance, and paginates the result.

Distance is measured to the property polygon. The computed distance is not returned in the response.

## Frontend flow

1. Let the user enter longitude and latitude directly, or let the user select a place using the Mapbox SDK and use the coordinates returned for that selection.
2. Put the resulting longitude in `longitude` and latitude in `latitude`. Obtain a radius in kilometres from the frontend UI.
3. Send an authenticated GET request. Display the returned properties and use `meta` to request subsequent pages.
4. After the search, use the viewport endpoint as the user interacts with the live map so the displayed property polygons update with the visible map area.

Mapbox place search is a frontend coordinate source; this backend endpoint receives numeric coordinates. The repository does not define the Mapbox search UI, SDK configuration, or how a radius is selected.

### Updating the live map after search

The radius search is the initial point-based request. For subsequent map interactions, call `GET /api/v1/property/viewport` with the current visible bounds: `north`, `south`, `east`, and `west`. The viewport endpoint returns properties whose polygons intersect that bounding box, allowing the frontend to refresh the polygons shown as the map view changes. It also accepts optional `zoom`, `page`, `limit`, `companyId`, `status`, and `propertyType` query parameters. A valid bearer token is required.

The viewport endpoint uses the same paginated property lookup response shape. Both endpoints apply the `propertyType` filter; on the viewport endpoint, a `zoom` value below `12` also limits results to properties with area greater than `10000`. The frontend determines when to issue each viewport request during map interaction.

## Query parameters

| Parameter      | Required | Accepted value and behavior                                                                                                                                                           |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `latitude`     | Yes      | Number; parsed from the query string as a floating-point value.                                                                                                                       |
| `longitude`    | Yes      | Number; parsed from the query string as a floating-point value.                                                                                                                       |
| `radiusKm`     | Yes      | Number in kilometres; multiplied by 1,000 for the spatial query.                                                                                                                      |
| `page`         | No       | Number parsed as an integer; defaults to `1`.                                                                                                                                         |
| `limit`        | No       | Number parsed as an integer; defaults to `1000` for this endpoint.                                                                                                                    |
| `companyId`    | No       | UUID. Restricts results to one company after the server checks map access for the company owner or an admin.                                                                          |
| `status`       | No       | One of `NOT_VERIFIED`, `PENDING`, `PENDING_REVERIFICATION`, `IN_REVIEW`, `VERIFIED`, `REJECTED`. Applied when the request is company-scoped or the requester is not a regular `USER`. |
| `propertyType` | No       | `LAND` or `HOUSE`; narrows results to the requested property type.                                                                                                                    |

The DTO validates numeric types but does not specify latitude/longitude bounds, a positive radius, or minimum page/limit values. Clients should validate their own UI inputs; the server contract should not be assumed to enforce those ranges.

## Request example

These coordinates illustrate request syntax; they do not imply that a property exists at that location.

```bash
curl -G 'https://<api-host>/api/v1/property/point' \
  -H 'Authorization: Bearer <access-token>' \
  --data-urlencode 'latitude=6.5244' \
  --data-urlencode 'longitude=3.3792' \
  --data-urlencode 'radiusKm=5' \
  --data-urlencode 'page=1' \
  --data-urlencode 'limit=20'
```

## Result and pagination

A successful response wraps a paginated result in `data`. The wrapper has `success: true`, `message: "SUCCESS!"`, and `status: 200`. The paginated result contains a `data` array and a `meta` object.

| Field         | Meaning                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.data[]` | Property lookup records: `propertyId`, `name`, `pin`, `description`, `propertyVerificationStatus`, `area`, `polygon`, `address`, `city`, `state`, `propertyType`, `isSubProperty`, `isPublic`, `users`, and `company`. |
| `data.meta`   | `totalItems`, `itemCount`, `itemsPerPage`, `totalPages`, `currentPage`, `hasNextPage`, and `hasPreviousPage`.                                                                                                          |

`polygon` is the stored geographic polygon. `users` is populated for sub-properties and is `null` otherwise. `company` is `null` when no company is linked. A regular `USER` searching across companies receives `propertyVerificationStatus: null`; company-scoped and other-role searches include that status.

An empty first page, when no properties match, has this shape:

```json
{
  "success": true,
  "message": "SUCCESS!",
  "data": {
    "data": [],
    "meta": {
      "totalItems": 0,
      "itemCount": 0,
      "itemsPerPage": 20,
      "totalPages": 0,
      "currentPage": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  },
  "status": 200
}
```

This is an illustrative empty result for the example request with `limit=20`. The actual list depends on stored properties and access scope.

## Visibility and access

- The request requires a valid bearer token. The authenticated user ID is read from the request.
- For a regular `USER` without `companyId`, only properties with `isPublic = true` are returned. In this case, a supplied `status` is not applied.
- When `companyId` is supplied, the requester must own that company or have `ADMIN` or `SUPER_ADMIN` role. Matching properties are restricted to that company, and `status` can be applied.
- For other authenticated roles without `companyId`, the nearby service does not add a public-only filter; it applies `status` when provided.

## Errors and integration notes

Invalid or missing query values can produce a validation error. A missing or invalid bearer token produces an authentication error. A requester without access to a supplied company receives an unauthorized error. The global exception filter wraps errors as `{"success": false, "message": "ERROR!", "description": ..., "status": ...}`; the details in `description` depend on the failure.

For pagination, increment `page` while `data.meta.hasNextPage` is true. Preserve the same point, radius, and filters across pages. The backend orders by distance, but distance values are not exposed to clients.
