// Figma opacity includes zero. A truthiness default (value || 100) makes fully
// transparent objects opaque after transfer. Only missing/invalid values default.
function aeuxOpacityPercent(value) {
    return typeof value==='number' && isFinite(value) ? value*100 : 100;
}

// Native square/circle alpha calibration at Figma radii 8/32/128/800.
// Layer blur only: background blur and shadow radii use different contracts.
function aeuxLayerBlurAmount(radius) {
    if (typeof radius !== 'number' || !isFinite(radius) || radius < 0)
        throw new Error('Invalid Figma layer blur radius');
    return radius * 1.5;
}
