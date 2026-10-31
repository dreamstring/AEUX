# AEUX — Figma to After Effects

Community-maintained by [Dring Qian (dreamstring)](https://github.com/dreamstring),
based on [AEUX by Adam Plouff](https://github.com/google/AEUX).
Independent fork; not an official Google or Adobe product.

**1.0 is under development. This branch is not a finished release.**
See [GOAL.md](GOAL.md) for migration and acceptance status.

## Direction

Transfer designs into editable AE layers. Keep text, shapes and images editable.
Use precomps where clipping, masks or isolation require them. Sketch is outside
this fork's scope. Avoid large arithmetic blend helper graphs by default.

## Repairs being migrated

- Matrix positioning for rotation, flips and nested frames.
- Raster export bounds, crop metadata and oversized images.
- Text placement, tracking and mixed appearance handling.
- Zero opacity, blur calibration and shadow distance safeguards.
- Mask scopes, clipping and rounded corners.
- Export progress and actionable errors.

This list describes migration scope, not completed 1.0 guarantees. Fonts, complex
text paints, background blur and combined fill/stroke blending need regression
checks. Raster fallbacks must be explicit; editable output is the default.

## Development

Run npm test for portable geometry, opacity/blur and typography contracts.
Desktop import acceptance and paired packaging are still pending.

## License and credits

Original AEUX: Adam Plouff and upstream contributors. Maintenance and new fixes:
Dring Qian (dreamstring). [Apache 2.0](LICENSE.md). Original source notices remain.
Historical upstream documentation may describe unsupported installation paths.
