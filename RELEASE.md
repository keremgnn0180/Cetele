# Release Process

## Local Verification

```bash
npm ci
npm run typecheck
npm test
npm run build
```

## Versioning

Use semantic versions:

- Patch: bug fixes, icon/update fixes, small UI corrections.
- Minor: new features.
- Major: breaking database or licensing changes.

## GitHub Release

1. Update `package.json` version.
2. Commit changes.
3. Create and push tag: `vX.Y.Z`.
4. GitHub Actions builds Windows artifacts.
5. Confirm release contains `latest.yml`, setup exe and blockmap.

## Code Signing Readiness

Production sales require Windows code signing. Add certificate secrets to CI and enable signing in `electron-builder`.
