/* Gera PNGs reais a partir do mascote original, sem alterar public/catty.png.
   Sem dependências de terceiros: compatível com builds Node em CI e Render. */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const sourcePath = path.resolve(__dirname, '../public/catty.png');
const target = path.resolve(__dirname, '../dist/icons');
const png = fs.readFileSync(sourcePath);
const signature = Buffer.from([137,80,78,71,13,10,26,10]);
if (!png.subarray(0,8).equals(signature)) throw Error('Arquivo original da Catty não é PNG.');

let position = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
let palette = null, transparency = null;
const compressed = [];
while (position + 12 <= png.length) {
  const length = png.readUInt32BE(position);
  const tag = png.toString('ascii', position + 4, position + 8);
  const chunk = png.subarray(position + 8, position + 8 + length);
  if (tag === 'IHDR') {
    width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4);
    bitDepth = chunk[8]; colorType = chunk[9]; interlace = chunk[12];
  }
  if (tag === 'PLTE') palette = chunk;
  if (tag === 'tRNS') transparency = chunk;
  if (tag === 'IDAT') compressed.push(chunk);
  position += 12 + length;
  if (tag === 'IEND') break;
}
if (!width || !height || width > 8192 || height > 8192) throw Error('Dimensões PNG inválidas.');
if (![8,16].includes(bitDepth) || interlace) throw Error('PNG interlaçado ou com profundidade de cor não suportada.');
const channels = {0:1,2:3,3:1,4:2,6:4}[colorType];
if (!channels || (colorType === 3 && bitDepth !== 8)) throw Error('Formato PNG não suportado.');
const sampleBytes = bitDepth / 8;
const bpp = channels * sampleBytes;
const stride = width * bpp;
const inflated = zlib.inflateSync(Buffer.concat(compressed));
const rgba = Buffer.alloc(width * height * 4);
let offset = 0;
let previous = Buffer.alloc(stride);
const paeth = (a,b,c) => {
  const p=a+b-c, da=Math.abs(p-a), db=Math.abs(p-b), dc=Math.abs(p-c);
  return da<=db&&da<=dc?a:db<=dc?b:c;
};
for (let y=0; y<height; y++) {
  if (offset >= inflated.length) throw Error('PNG truncado.');
  const filter=inflated[offset++];
  const row=Buffer.alloc(stride);
  for(let x=0;x<stride;x++) {
    const raw=inflated[offset++], a=x>=bpp?row[x-bpp]:0, b=previous[x], c=x>=bpp?previous[x-bpp]:0;
    const predictor=[0,a,b,(a+b)>>1,paeth(a,b,c)][filter];
    if (predictor===undefined || raw===undefined) throw Error('Filtro PNG inválido.');
    row[x]=(raw+predictor)&255;
  }
  const read=(index)=>row[index*sampleBytes];
  for(let x=0;x<width;x++) {
    const start=x*channels;
    let r=0,g=0,b=0,a=255;
    if(colorType===6){r=read(start);g=read(start+1);b=read(start+2);a=read(start+3);}
    else if(colorType===2){r=read(start);g=read(start+1);b=read(start+2);}
    else if(colorType===0){r=g=b=read(start);}
    else if(colorType===4){r=g=b=read(start);a=read(start+1);}
    else if(colorType===3){
      const index=read(start);
      r=palette?.[index*3]??0;g=palette?.[index*3+1]??0;b=palette?.[index*3+2]??0;
      a=transparency?.[index]??255;
    }
    const i=(y*width+x)*4;
    rgba[i]=r;rgba[i+1]=g;rgba[i+2]=b;rgba[i+3]=a;
  }
  previous=row;
}

const crcTable=Array.from({length:256},(_,n)=>{
  let c=n;for(let k=0;k<8;k++) c=c&1?0xedb88320^(c>>>1):c>>>1;
  return c>>>0;
});
function chunk(kind,payload) {
  const tag=Buffer.from(kind,'ascii');
  const len=Buffer.alloc(4);len.writeUInt32BE(payload.length,0);
  let crc=0xffffffff;
  for(const byte of Buffer.concat([tag,payload])) crc=crcTable[(crc^byte)&255]^(crc>>>8);
  const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0,0);
  return Buffer.concat([len,tag,payload,tail]);
}
function icon(size,padding) {
  const scan=Buffer.alloc((size*4+1)*size);
  const usable=size*(1-2*padding);
  const scale=Math.min(usable/width,usable/height);
  const scaledWidth=width*scale,scaledHeight=height*scale;
  const left=(size-scaledWidth)/2,top=(size-scaledHeight)/2;
  for(let y=0;y<size;y++) {
    const rowStart=y*(size*4+1);
    scan[rowStart]=0;
    for(let x=0;x<size;x++) {
      const i=rowStart+1+x*4;
      scan[i]=255;scan[i+1]=255;scan[i+2]=255;scan[i+3]=255;
      if(x<left||x>=left+scaledWidth||y<top||y>=top+scaledHeight) continue;
      const fx=Math.max(0,Math.min(width-1,(x-left+.5)/scale-.5));
      const fy=Math.max(0,Math.min(height-1,(y-top+.5)/scale-.5));
      const x0=Math.floor(fx),y0=Math.floor(fy);
      const x1=Math.min(width-1,x0+1),y1=Math.min(height-1,y0+1);
      const dx=fx-x0,dy=fy-y0;
      const weights=[(1-dx)*(1-dy),dx*(1-dy),(1-dx)*dy,dx*dy];
      const offsets=[(y0*width+x0)*4,(y0*width+x1)*4,(y1*width+x0)*4,(y1*width+x1)*4];
      for(let c=0;c<3;c++) {
        let value=0;
        for(let n=0;n<4;n++){
          const alpha=rgba[offsets[n]+3]/255;
          value+=weights[n]*(rgba[offsets[n]+c]*alpha+255*(1-alpha));
        }
        scan[i+c]=Math.round(value);
      }
    }
  }
  const header=Buffer.alloc(13);
  header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);
  header[8]=8;header[9]=6;header[10]=0;header[11]=0;header[12]=0;
  return Buffer.concat([signature,chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
fs.mkdirSync(target,{recursive:true});
for(const [name,size,padding] of [
  ['icon-192.png',192,.07],
  ['icon-512.png',512,.07],
  ['icon-maskable-512.png',512,.18],
  ['apple-touch-icon.png',180,.08]
]) fs.writeFileSync(path.join(target,name),icon(size,padding));
fs.copyFileSync(path.join(target,'apple-touch-icon.png'),path.resolve(__dirname,'../dist/apple-touch-icon.png'));
console.log('Ícones PWA gerados a partir da Catty original ('+width+'x'+height+').');
