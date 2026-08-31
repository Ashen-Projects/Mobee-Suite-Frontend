# Mobee Frontend Production Deployment

## Production layout

- Site: `https://suite.mobee.lk`
- Build-time API URL: `https://api.suite.mobee.lk/api/v1/`
- Release history: `/www/projects/Mobee-Suite-Frontend/releases/<git-sha>`
- aaPanel/Nginx document root: `/www/wwwroot/suite.mobee.lk`
- Automatic rollback copy: `/www/wwwroot/.suite.mobee.lk.previous`

No aaPanel project change is required. The workflow publishes into the existing document-root path.

## GitHub setup

Create a GitHub environment named `production` in the frontend repository. Add a required reviewer when the repository plan supports it.

Add the same environment secrets used by the backend repository:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | VPS hostname or IP address |
| `VPS_PORT` | SSH port, normally `22` |
| `VPS_USER` | Current deployment user, currently `root` |
| `VPS_SSH_PRIVATE_KEY` | Private half of the dedicated deployment key |
| `VPS_KNOWN_HOSTS` | Trusted `known_hosts` line for the VPS |

The frontend workflow contains only public Vite build settings. Never add Firebase Admin service-account JSON, database passwords, or server secrets to a `VITE_` variable: Vite embeds those values into browser files.

## Deployment flow

1. A pull request or push to `dev`/`main` installs locked dependencies, lints, and builds the application.
2. A push to `main` waits for the `production` environment approval when configured.
3. Vite builds with the HTTPS production API URL.
4. GitHub uploads an immutable release named with the commit SHA.
5. The VPS prepares a new document-root directory.
6. The existing document root moves to the rollback path and the new directory takes its place.
7. Public HTTPS verification runs.
8. A failed verification automatically restores the previous document root.
9. The five newest immutable releases are retained.

## Branch protection

Protect `main` in both repositories:

- require a pull request;
- require the CI workflow to pass;
- require at least one approval;
- block force pushes and deletion;
- allow production deployment only from `main`.

## Local environment

Create a local file from the safe template:

```bash
cp .env.example .env
```

The `.env` file is ignored and must never be committed.
