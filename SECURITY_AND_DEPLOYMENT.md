# Security and deployment notes

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
