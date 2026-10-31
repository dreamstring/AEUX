# Paint compatibility follow-up

1.0.3 adds a narrowly qualified editable image-text path. It does not establish
general equivalence between Figma paint stacks and AE layers.

Future acceptance should examine each source layer and its paint stack:

| Area | Next cases |
| --- | --- |
| Image-filled text | FILL/FIT/CROP, tile rotation, filters, transformed parents, edit beyond original frame |
| Multiple paints | Fill order, per-paint opacity, per-paint blend modes and isolation |
| Text styles | Mixed runs, image plus solid/gradient fills, font availability |
| Strokes | Inside/center/outside alignment, image/gradient stroke and independent blend |
| Effects | Effects before/after matte, blur, shadows and group opacity |
| Clipping | Multiple masks, parent clips, transformed containers and matte scope |

Use editable native layers where their rendering semantics match. Use a separate
texture plus editable glyph matte where appropriate. Retain explicit appearance
fallbacks when equivalence is unverified; report the affected layer rather than
silently assuming every paint is representable. Validate both recursive layer
structure and rendered pixels, not just an overall screenshot.
