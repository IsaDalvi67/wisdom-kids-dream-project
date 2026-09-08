# Wisdom Kids Dream Project — V10 Final Update

V10 is the final planned update of the current WKDP website series.

## Included
- V9 security controls retained.
- Login attempt rate limiting retained.
- Recovery/lockdown donation-verification freeze retained.
- Audited emergency account recovery capability.
- External Files portal placeholder.

## Files portal configuration
The external files website URL is stored in:

`recovery-vault-config.js`

Replace `FILES_SITE_URL` with your separate website's HTTPS URL.

## Deployment configuration
Configure recovery credentials as Netlify environment variables. Do not put passwords in frontend files or commit them to GitHub.
