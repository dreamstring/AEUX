// AE's TextDocument.tracking is in thousandths of an em. Verified against AE
// 23.5 by measuring HHH at sizes 16/32/64 and tracking 0/100.
function aeuxTrackingToAe(letterSpacing, fontSize) {
    if (!letterSpacing || typeof letterSpacing.value!=='number' || !isFinite(letterSpacing.value)) return 0;
    if (letterSpacing.unit==='PERCENT') return letterSpacing.value*10;
    if (letterSpacing.unit==='PIXELS' && typeof fontSize==='number' && fontSize>0) return letterSpacing.value/fontSize*1000;
    return 0;
}
// TextDocument.tracking uses thousandths of an em; Text Animator Tracking Amount
// uses document pixels. Verified in AE 23.5 with native point-text measurements.
function aeuxTrackingAnimatorPixels(tracking, fontSize) {
    if(!isFinite(tracking)||!isFinite(fontSize)||fontSize<=0)return 0;
    return tracking*fontSize/1000;
}
