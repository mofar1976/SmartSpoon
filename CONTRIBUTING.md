# Contributing to SmartSpoon

Thank you for helping improve SmartSpoon. For substantial changes, open an issue
first to agree on the problem and scope. Bugs, accessibility improvements,
translations and documentation corrections are welcome.

## Branches and pull requests

1. Fork the repository or create a working branch from `develop`.
2. Make a focused change and run the relevant checks from the README.
3. Open a pull request targeting `develop`, including the problem, resulting
   behaviour and actual validation results.
4. Maintainers promote changes through `develop` → `preview` → `main` using pull
   requests. Feature branches must not target `preview` or `main`.

`main` is the public release branch; `develop` is the integration branch. These
stages do not deploy a running application. CI must pass before merging.

## Project conventions

- Backend code and configuration live in `Backend/`; frontend code in `Frontend/`.
- Keep NestJS controllers thin and separate application logic from AI providers.
- Use classic NgRx. Each store lives in its own `shared/store/<name>` folder,
  including its service, actions, state, reducer, selectors, effects and facade.
- Components have their own folder with separate `.ts`, `.html` and `.scss` files.
  Feature components belong in `features/<feature>/components`; reusable UI in
  `shared/ui`. Prefer Tailwind utilities and existing shared components.
- Update both English and German JSON translations for user-facing text.
- Use the frontend's Prettier configuration for changed frontend files.
- Never invent supermarket prices. Money is calculated in integer cents from
  catalog data. Clearly label test data.
- Recipe preferences belong to each request, not to the user profile.
- Add meaningful checks for changed behaviour. Store unit tests are not required.

## Validation

Run `npm run typecheck` and `npm test` from both application folders; also run
`npm run build` from `Frontend/`. The backend test command builds first. Python
recognition tests and isolated MongoDB/Docker integrations run in CI. See the
[README](README.md) and [backend guide](Backend/README.md) for setup.

Do not use production data or real Gemini keys in automated tests. Keep `.env`,
credentials, personal photos, model weights and database files out of commits.
Internal `docs/` and `AGENTS.md` are local-only and ignored.

## Reporting issues and security problems

Use issue templates for bugs and feature proposals. Share minimal reproduction
steps, versions and redacted errors; never include access tokens or personal data.
Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

Be respectful, discuss the work rather than the person, and keep reviews concrete.
By submitting a contribution you agree to license your original contribution under
the project's [MIT License](LICENSE), and confirm that you have permission to
contribute it. Third-party material must retain its own applicable notices.
