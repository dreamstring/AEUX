# AEUX reproducible build checkpoint

Accepted reference: published v1.0.2. The tag and published ZIP remain unchanged.

- [x] Freeze the accepted archive SHA-256 and all 3,663 installed-file hashes.
- [x] Vendor the frozen frontend and pinned CEP runtime dependencies.
- [x] Check in exporter, geometry, appearance, mask, shadow, typography and CEP repair sources used by the maintained build.
- [x] Regenerate browser repair slots, raster export helpers, CEP interception and AE host from checked-in sources.
- [x] Provide offline build and packaging commands with Node.js built-ins only.
- [x] Match all installed files byte for byte to accepted 1.0.2.
- [x] Build twice and verify deterministic ZIP output and extraction roundtrip.
- [x] Validate a clean checkout without local work folders or installed apps.

## Separate future migration

- [ ] Replace frozen compiled legacy frontend dependencies with full Vue/TypeScript source builds.
- [ ] Remove obsolete upstream source paths after their replacements are verified.
- [ ] Decompose the larger protocol rule module while preserving this baseline.

The frozen dependency is intentional and documented in vendor/README.md. A new
build can be produced entirely from the repository without the original author's
machine. This does not mean every historical compiled dependency has been
reimplemented from source. Offline file identity establishes parity with the
accepted release, not new host-version, font or visual compatibility.
