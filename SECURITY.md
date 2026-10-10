# Security policy

## Supported development

SmartSpoon is an early-stage project with no stable release support guarantee.
Security fixes are integrated into `develop` and promoted through `preview` to
`main`. Use the latest revision and keep dependencies up to date.

## Report a vulnerability privately

Use GitHub's private vulnerability reporting form:

https://github.com/mofar1976/SmartSpoon/security/advisories/new

Include affected revisions, reproduction steps, expected impact and a minimal
proof of concept using synthetic data. Do not open a public issue for an unpatched
vulnerability or include real credentials, user data or personal photographs.
If the form is unavailable, wait until a private reporting channel is restored;
do not publish sensitive details in issues.

Reports are handled on a best-effort basis. There is currently no response-time
commitment or paid bug bounty. Please allow maintainers time to investigate and
coordinate disclosure before publishing details.

## Local setup and AI boundaries

The included Docker Compose stack is for local development. Ports are bound to
loopback, and MongoDB has no authentication in this setup. Production deployment
requires a separate configuration and review.

Use your own random JWT secret and internal recognition token. Keep all keys in
local environment files or deployment secret storage. Rotate any exposed secret;
deleting a committed value does not revoke it.

Photos are processed locally without persistence or a cloud vision fallback.
Confirmed text ingredients, recipe preferences and derived age are sent to Gemini
for recipe generation. Do not submit sensitive material in tests or reports.
Recognition and recipe suggestions can be wrong, and cannot guarantee allergen
safety. Check ingredients and product labels before cooking.
