# Editable image text preview

Build with `npm run build:image-text`. The paired candidate location is written to
`dist/image-text-latest.json`; the ordinary 1.0.2 build remains unchanged.
Run `npm run test:image-text` for qualification, immutable scene conversion and
temporary-plane cleanup checks. Run `npm run check` for frozen baseline parity.

The first contract supports uniform text with one image fill and no visible
strokes or effects. Figma exports the image paint on a temporary rectangle with
the text frame dimensions. Native AE text provides an Alpha track matte for that
texture plane. No extra precomp is created. The original text is never modified.

Runtime validation on Windows, Figma 126.10.7 and AE 23.5:

- Real single-run TILE 240% text: original texture and temporary plane match
  exactly over 537,210 opaque glyph pixels.
- Actual converter and candidate AE host create two layers: editable text matte
  and texture footage. Source Text modification and restoration succeed.
- Formal PNG render: RGB difference at most 1/255 over 536,086 overlapping opaque
  pixels; visible glyph bounds differ by about one pixel at antialiased edges.
- Original-frame texture coverage only; automatic expansion or infinite tiling
  after editing is not implemented.

The feature is included in the paired 1.0.3 release. The production Figma queue
has not yet been exercised as a complete paired UI send; current native evidence
covers live Figma plane capture, actual converter and native AE import/render.
Private design captures and font assets are deliberately not included here.
