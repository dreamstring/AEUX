# AEUX — Figma to After Effects

![AEUX 1.0.0 Figma plugin and After Effects panel](assets/aeux-panels.png)

Community-maintained by [Dring Qian (dreamstring)](https://github.com/dreamstring),
based on [AEUX by Adam Plouff](https://github.com/google/AEUX).
Independent fork; not an official Google or Adobe product.

**Current version: 1.0.0.**
The current accepted feature set is the 1.0.0 baseline. Additional features and
compatibility improvements will follow in later versions.

## Direction

Transfer designs into editable AE layers. Keep text, shapes and images editable.
Use precomps where clipping, masks or isolation require them. Sketch is outside
this fork's scope. Avoid large arithmetic blend helper graphs by default.

## 1.0.0 repair scope

- Matrix positioning for rotation, flips and nested frames.
- Raster export bounds, crop metadata and oversized images.
- Text placement, tracking and mixed appearance handling.
- Zero opacity, blur calibration and shadow distance safeguards.
- Mask scopes, clipping and rounded corners.
- Export progress and actionable errors.

Fonts, complex text paints, background blur and combined fill/stroke blending
remain areas for further compatibility testing. Raster fallbacks must be
explicit; editable output is the default.

## Development

Run npm test for portable geometry, opacity/blur and typography contracts.
Repository source synchronization and reproducible paired packaging are tracked
in [GOAL.md](GOAL.md). The Figma/AE application directories have not yet been
synchronized with the locally accepted 1.0.0 package; downloading this repository
is not currently a substitute for that package.

## License and credits

Original AEUX: Adam Plouff and upstream contributors. Maintenance and new fixes:
Dring Qian (dreamstring). [Apache 2.0](LICENSE.md). Original source notices remain.
Historical upstream documentation may describe unsupported installation paths.
