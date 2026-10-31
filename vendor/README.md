# Frozen runtime dependency

`aeux-1.0.2-runtime.zip` is the published, accepted paired 1.0.2 runtime.
Its SHA-256 and individual file hashes are frozen in `tests/baseline/1.0.2.json`.
Do not silently replace it when making a new release. It is a build input and
acceptance oracle, not the generated output.

The archive retains Apache 2.0 and bundled third-party licenses. Dependency
versions and manifest hashes are recorded in `dependencies.json`. These Node
runtime dependencies are unpacked inside CEP; the build never downloads them.

The legacy Figma converter shell, CEP Vue frontend, fonts, CSS and third-party
bundles remain compiled dependencies. Original upstream frontend sources remain
in `Figma/AEUX` and `Ae/AEUX`, but their old build commands are NOT the maintained
release pipeline. The new pipeline regenerates the extracted repair functions,
browser rule bundle, PNG export code, CEP interceptor and AE host from checked-in
source and templates, then verifies every shipped file against 1.0.2.

This is reproducible runtime assembly with source-generated repair modules.
It does not claim a complete rebuild of every legacy frontend dependency from
original TypeScript/Vue source. Replacing those frozen dependencies is a separate
migration, with this baseline protecting current behavior.
