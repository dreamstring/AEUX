# AEUX 1.0 maintenance goal

Maintainer: [Dring Qian / dreamstring](https://github.com/dreamstring).
Based on google/AEUX commit 573d07d. Preserve Apache 2.0 and original credits.

- [x] Create public fork and local maintenance branch.
- [x] Remove Sketch distribution.
- [ ] Remove active Sketch-specific converter paths.
- [ ] Port verified Figma and CEP fixes into reproducible source builds.
- [ ] Version both applications 1.0.0 with clear fork identity.
- [ ] Default to editable layers, without arithmetic blend helper forests.
- [ ] Preserve necessary clipping, masks and isolation only.
- [ ] Test transforms, raster bounds, text, blur, shadows, masks and paint order.
- [ ] Inspect recursive output hierarchy, not only flattened screenshots.
- [ ] Package paired distributables and scan for private data and machine paths.

Do not modify installed CEP or operate AE while the maintainer uses it.
This migration is not yet a usable 1.0 release. Font substitution and Overlay
fill/stroke edges remain regression cases. Private test results do not establish
universal compatibility.
