# Wisdom Kids Dream Project — V4 Final Build

This build contains:
- `index.html` — public donor website
- `staff.html` — real staff verification panel
- Netlify Functions — secure API
- Turso — persistent donation database
- Manual verification only
- Email payment-proof workflow
- Global daily Donation Numbers: `WKDP-DDMMYY-####`
- Wisdom Kids School-inspired visual theme

## Before deployment

Create a Turso database, then add these environment variables in Netlify **Project configuration → Environment variables** with Functions access:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `WKDP_STAFF_USER`
- `WKDP_STAFF_PASSWORD`
- `WKDP_SESSION_SECRET`

Use a strong staff password and a long random session secret. Keep all of these private. Do not put them into `index.html` or `staff.html`.

The database tables are created automatically by the Functions. `schema.sql` is also included for reference.

## Deploy

Deploy the whole folder/project, not only `index.html`, because V4 uses Netlify Functions and an npm dependency.

Public site:
- `/`

Staff panel:
- `/staff.html`

## Manual verification workflow

1. Donor enters details.
2. Backend issues the official Donation Number.
3. Donor pays by UPI or bank transfer.
4. Donor taps **Email Payment Proof**.
5. Their email opens with the Donation Number already in the subject/body.
6. Donor attaches their payment screenshot and sends it.
7. Staff checks the actual school bank/UPI account.
8. Staff signs into `/staff.html`, searches the Donation Number, and marks it Verified / Rejected / Pending.
9. Donor checks status on the public website using Donation Number + donor email.

A screenshot alone must not be treated as proof of payment. Staff should verify against the actual school account.

## Notes

- Automatic UPI verification is intentionally not included.
- WhatsApp proof submission is intentionally not included.
- V5 features (Maps, FAQ, transparency expansion, fundraiser sharing) are not folded into this build.
