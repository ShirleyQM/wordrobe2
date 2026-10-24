const assert=require('assert/strict'),mask=require('./assets/garment-body-occlusion.js');
const css=mask.style([{bodyOcclusionRects:[[310,720,320,710]]}]);
const match=css.match(/mask-image:url\('([^']+)'\)/);assert.ok(match,'SVG data URI must be quoted so inner url(...) cannot terminate CSS URL');
const svg=decodeURIComponent(match[1].split(',').slice(1).join(','));assert.match(svg,/x="310" y="720" width="320" height="710"/);assert.match(svg,/mask="url\(#body-cut\)"/);
assert.equal(mask.geometry([{hideBodyFrom:1500}]).cut,1500);console.log('PASS: body mask uses a valid quoted SVG URL and preserves garment occlusion geometry.');
