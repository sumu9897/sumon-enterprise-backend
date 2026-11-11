# Security and deployment notes

## Authentication architecture

The admin UI uses an HttpOnly JWT cookie as its primary session. In production
the cookie is `Secure`, `SameSite=None`, scoped to `/api`, and inaccessible to
JavaScript. Every state-changing cookie-authenticated request must include the
session-bound `X-CSRF-Token` value returned by login or `/auth/me`.

For compatibility with API tools and browsers that block cross-site cookies,
Bearer JWT authentication remains supported. The frontend keeps this fallback
only in `sessionStorage`; legacy `localStorage` tokens are migrated and deleted.
Use same-site custom domains for the frontend and API when possible, because
cross-site cookie policies vary between browsers.

Changing/resetting a password or using **Sign out all sessions** increments the
administrator's `tokenVersion` and revokes all existing JWTs.

## Required production environment validation

Startup fails closed when `MONGODB_URI`, `JWT_SECRET`, or `FRONTEND_URL` is
missing, when `JWT_SECRET` is shorter than 32 characters, or when a production
frontend origin is not HTTPS. Enabling Cloudinary also requires all three
Cloudinary variables. Keep `ALLOW_LOCALHOST_ORIGIN=false` in production.

Generate secrets with a cryptographically secure password manager or secret
generator. Do not copy values from `.env.example` into production unchanged.

## Upload security

Multer enforces the configured size and file-count limits. Uploaded JPEG, PNG,
and WebP files are additionally checked by magic bytes before controller or
Cloudinary processing; a MIME header or filename alone is not trusted. Direct
Cloudinary project uploads still use the authenticated, rate-limited signature
endpoint and Cloudinary's image resource endpoint.

## Deployment order

1. Back up MongoDB and verify the most recent restore test.
2. Rotate any credential that has been shared or exposed.
3. Configure backend production variables from `.env.example`.
4. Deploy backend and verify `/api/health`.
5. Configure frontend `VITE_API_URL` and deploy the frontend.
6. Verify login, logout, password reset, project CRUD, CMS upload, and inquiry submission.
7. Review Vercel runtime logs for request IDs and unexpected 4xx/5xx responses.

No database migration is required for the cookie/CSRF and upload hardening in
this upgrade.

## Primary administrator migration

The migration only promotes an existing account. It never creates an account or changes its password.

1. Back up the `admins` collection.
2. Set `PRIMARY_ADMIN_EMAIL=sumonconstruction2024@gmail.com` and `CONFIRM_PRIMARY_ADMIN_MIGRATION=yes` for one command.
3. Run `npm run migrate:primary-admin`.
4. Remove `CONFIRM_PRIMARY_ADMIN_MIGRATION` immediately.

Rollback: change the role back to `admin` only after confirming another protected `superadmin` exists.

## Replace and reseed the primary administrator

`npm run seed:primary-admin` replaces only the account selected by
`ADMIN_SEED_EMAIL`. It validates and hashes the replacement password before the
database transaction deletes the old record. Set `ADMIN_SEED_PASSWORD` to at
least 12 characters and `CONFIRM_ADMIN_REPLACEMENT=yes` for that one command,
then remove both values. The seeded owner receives the `superadmin` role.

## Password recovery and email

Configure `FRONTEND_URL` with the production HTTPS origin and SMTP variables from `.env.example`. Gmail requires an App Password; never use the normal account password. Reset links expire after 15 minutes, are stored only as SHA-256 hashes, are single-use, and increment `tokenVersion` to revoke all existing JWT sessions.

Email delivery must be verified against the selected provider before production launch. A saved inquiry remains successful even if a notification email fails; delivery failures are logged on the server.

## Vercel

The repository currently has separately linked frontend and backend Vercel projects. Keep both projects unless intentionally migrating to the newer Vercel Services model. If migrating, use the current `services` key plus top-level rewrites; `experimentalServices` is legacy.

The locally detected Vercel CLI is outdated (59.3.0). Upgrade to 63.1.2 or later before changing deployment configuration: `npm i -g vercel@latest`.

## Secrets

Do not commit `.env` files. If a credential has ever been committed or shared, rotate it in MongoDB Atlas, the mail provider, Cloudinary, and Vercel, then update the deployment environment variables.

Recommended rotation order: MongoDB user password, SMTP/API key, Cloudinary API
secret, JWT secret, then administrator password. A JWT secret rotation signs out
all active sessions by design.

## Monitoring and backup recommendations

- Alert on repeated 401/403/429 responses and all 5xx responses by request ID.
- Retain audit logs according to the company's access-review policy.
- Enable MongoDB Atlas automated backups and perform periodic restore drills.
- Configure Cloudinary asset backup/versioning appropriate to the account plan.
- Never log authorization headers, cookies, reset tokens, passwords, or raw credentials.
