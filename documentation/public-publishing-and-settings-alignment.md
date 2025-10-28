## Portfolioly – Public Publishing and Settings Alignment (Comprehensive Technical Changes)

### Executive Summary

This change-set unifies portfolio publishing across backend and frontend around a single source of truth: `chat_settings.access_mode` in user settings. It introduces a normalized user-settings API contract, fixes timestamp serialization issues, streamlines frontend API clients and UI flows, and ensures username initialization via a deterministic “ensure-username” step. Public portfolio access now strictly honors access mode while granting owners access with Firebase authentication.

### Backend Changes

#### API Surface: User Settings

- Router is mounted at `/users/me/settings` in `app.main` with `prefix="/users/me/settings"`. The user-settings router itself has an empty local prefix, so endpoints appear directly under `/users/me/settings`.
- Endpoints:

  - GET `/users/me/settings`
  - PATCH `/users/me/settings` (update username and/or visibility in a single call)
  - PUT `/users/me/settings/visibility` (legacy; retained)
  - PATCH `/users/me/settings/access-mode` (owner-only access-mode update; retained)
  - DELETE `/users/me/settings/username` (remove username; forces portfolio private)

- Response normalization

  - Introduced `UserSettingsResponse.from_document(...)` to normalize Firestore `DatetimeWithNanoseconds` timestamps to ISO strings and to return a consistent shape:
    - `username?: string`
    - `access_mode: "public" | "private"`
    - `chat_settings?: { access_mode?: "public" | "private"; ... }`
    - `public_token_enabled?: boolean`
    - `public_token_ver?: number`
    - `created_at?: string` (ISO)
    - `updated_at?: string` (ISO)

- Defaults when no settings document exists:

  - `username: null`
  - `chat_settings: { access_mode: "private" }`
  - `access_mode: "private"`
  - `public_token_enabled: true`
  - `public_token_ver: 1`

- Unified PATCH contract

  - Accepts `{ username?: string; access_mode?: "public" | "private" }`
  - Validates username format and availability when provided
  - Enforces that `access_mode: "public"` requires an existing username
  - Returns full normalized settings on success

- Backward compatibility
- Legacy endpoints retained: `PUT /visibility`, `PATCH /access-mode`
- The older `PUT /username` has been consolidated into the unified PATCH handler

#### Data Model and Schema

- `PortfolioChatSettings.access_mode` default set to `"private"` to avoid accidental public exposure.
- Legacy `is_public` boolean has been removed in favor of `chat_settings.access_mode` as the sole source of truth.

#### Public Portfolio Access Control

- `validate_portfolio_access(...)` now checks `chat_settings.access_mode` when a public requirement is enforced.
- `GET /public/portfolio/{username}` and `POST /public/ensure-token` behavior:
  - With a valid Firebase JWT, owner access is granted regardless of access mode (for preview/owner flows).
  - Without a Firebase JWT, access is only granted if `chat_settings.access_mode` is `"public"`.
  - If token generation is disabled (`public_token_enabled == false`), endpoints return 404.

#### Username Initialization

- `POST /public/ensure-username` verifies JWT and:
  - Returns existing username if present
  - Otherwise generates a username from the user’s email (appending suffix if needed) and persists it

#### Serialization Fixes

- Pydantic validation failures due to Firestore timestamps were eliminated by converting date fields to ISO strings in `UserSettingsResponse.from_document`.

### Frontend Changes

#### API Client (`apps/main/src/lib/api/userSettings.ts`)

- `getUserSettings()` now calls `GET /users/me/settings` and returns the normalized object.
- If the returned settings do not contain a `username`, the client attempts to initialize one by calling `ensure-username` using the current user’s UID.
- UID resolution works in both browser (`atob`) and Node/SSR (`Buffer`) contexts to decode the JWT payload when the Firebase user is not yet hydrated.
- `updateUsername` and `updateAccessMode` both use `PATCH /users/me/settings` with bodies:
  - `{ username }` for username updates
  - `{ access_mode: accessMode }` for visibility updates
- Types were expanded with `public_token_enabled` and `public_token_ver`.

#### Public Token Client (`apps/main/src/lib/api/publicToken.ts`)

- `ensurePublicToken(username, authToken?)` optionally sends a Firebase JWT so owners can preview private portfolios.
- `fetchUsernameAndToken(userId, authToken)` guarantees username initialization prior to token derivation.

#### UI & Hooks

- `usePublishStatus` consumes normalized settings. It computes `publicUrl` from the origin and `username`, and returns `hasUsername`, `isPublic`, `publicUrl`, and `username`.
- `PublishSettingsPanel` accepts `initialUsername`, `initialAccessMode`, and `isLoading` to avoid redundant client fetches; debounced username validation; copyable public URL when live; unified PATCH submission; and `onSettingsUpdate` callback.
- `EditorTopBar` wires publish state props into `PublishSettingsPanel`.
- `PortfolioEditor` shows dynamic banners for default username set, private mode, and public/live link states; a small helper (`renderPublishBanner`) improved readability.
- `PortfolioPreview` continues to ensure username and token for in-editor live preview and benefits from the updated backend logic.

### Access & Auth Flows

#### Owner Preview (Authenticated)

- `/preview` requires a valid Firebase JWT and fetches private data for the owner.
- `ensure-token` returns a token for owners regardless of `access_mode`.

#### Public Portfolio (Unauthenticated)

- `/p/{username}` first calls `ensure-token` with only the username.
  - 404 if the username does not exist, portfolio is private, or token generation is disabled.
  - On success, it uses the public token to fetch data from `/public/portfolio/{username}`.

#### Username Lifecycle

- Attempted on-demand via `getUserSettings()` on the client: if `username` is missing, the client calls `ensure-username` and persists the generated value.
- Editable via the Publish Settings UI.

### API Contracts (Selected)

#### GET `/users/me/settings`

```json
{
  "username": "johndoe",
  "access_mode": "private",
  "chat_settings": { "access_mode": "private" },
  "public_token_enabled": true,
  "public_token_ver": 1,
  "created_at": "2025-10-25T23:16:03Z",
  "updated_at": "2025-10-25T23:16:03Z"
}
```

#### PATCH `/users/me/settings`

Request bodies (any combo):

```json
{ "username": "johndoe" }
```

```json
{ "access_mode": "public" }
```

#### POST `/public/ensure-username`

```json
{ "user_id": "firebase_uid" } -> { "username": "johndoe" }
```

#### POST `/public/ensure-token`

- With Firebase JWT: returns token regardless of access mode (owner preview)
- Without JWT:
  - 200 with token if `access_mode` is `"public"`
  - 404 if private or token generation disabled

### Compatibility & Deprecations

- Replaced/Unified:
- Retained for compatibility:
  - `PUT /users/me/settings/visibility`
  - `PATCH /users/me/settings/access-mode`
- Replaced/Unified:
  - `PUT /users/me/settings/username` logic consolidated into the unified `PATCH /users/me/settings` handler

### Operational Notes

- No environment variable changes; clients continue to use `NEXT_PUBLIC_API_URL` / `env.API_BASE_URL`.
- Additional logging added around settings and token operations.
- Timestamp serialization handled at the route layer to keep clients consistent.

### Risk & Edge Cases

- Private portfolios return 404 (not 403) for unauthenticated public requests to prevent user enumeration.
- Reserved/invalid usernames rejected with meaningful 400/409 responses.
- Token generation respects `public_token_enabled`.
- `ensure-username` requires a valid Firebase JWT with matching `user_id`.

### Outcomes

- A single, consistent source of truth (`chat_settings.access_mode`) governs public access.
- Unified user-settings API with normalized responses simplifies clients and eliminates date serialization failures.
- Username management is deterministic and automated, improving first-run UX.
- Editor and public routes now exhibit predictable, secure behavior for both private and public portfolios.
