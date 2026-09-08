# Wisdom Kids Dream Project — V8

V8 adds the multi-account staff system and audit history while preserving the V7 donor website and Netlify/Turso donation backend.

## Roles
- Staff: view donation details and Verify / Reject / return to Pending.
- Admin: Staff permissions plus Staff account management. Admin-to-Admin deletion requires Account Manager approval.
- Account Manager: highest account-management authority. Managers cannot Verify or Reject donations. Manager deletion of Admin accounts is logged as SYSTEM with a mandatory reason.

## Audit
Audit entries show donation number, donated amount, action, timestamp and actor. Donation entries include View Details for donor information.

## Required Netlify environment variables
Existing:
- TURSO_DATABASE_URL
- TURSO_AUTH_TOKEN
- WKDP_SESSION_SECRET
- WKDP_STAFF_USER / WKDP_STAFF_PASSWORD (used to bootstrap the first Admin when the database has no accounts)

New for V8:
- WKDP_MANAGER_USER
- WKDP_MANAGER_PASSWORD

Keep all secrets in Netlify environment variables, never in GitHub or public HTML.

The first Manager and Admin are bootstrapped only when staff_users is empty. After accounts exist, manage them from /staff.html.


Bootstrap fix: the first Manager uses WKDP_MANAGER_USER + WKDP_MANAGER_PASSWORD, and the first Admin uses WKDP_STAFF_USER + WKDP_STAFF_PASSWORD. No email variables are required.

Bootstrap repair: Manager and Admin bootstrap are now checked independently. If one already exists, the missing account can still be created from its Netlify environment variables.

Login fix 8.0.4: bootstrap accounts use internal .invalid placeholder emails because the existing Turso staff_users schema requires a non-null unique email. No email verification is used.
