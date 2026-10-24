const fs=require('fs'),path=require('path');
// Legacy URLs remain readable while working art sessions finish in their original folders.
const aliases=[
 ['/assets/fit-catalog/','/assets/materials/garments/'],
 ['/assets/new-materials/','/assets/materials/sources/imported/'],
 ['/assets/live-wardrobe/','/assets/materials/published/'],
 ['/assets/extracted-motifs-v1/','/assets/materials/patterns/motifs/'],
 ['/assets/prints/','/assets/materials/patterns/classic/']
];
function canonicalURL(root,url){for(const [before,after]of aliases)if(url.startsWith(before)){const mapped=after+url.slice(before.length);if(fs.existsSync(path.join(root,mapped)))return mapped;}return url;}
module.exports={aliases,canonicalURL};
