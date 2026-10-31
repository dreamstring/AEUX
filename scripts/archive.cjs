'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const crcTable = Array.from({length: 256}, (_, n) => {
  for (let k=0;k<8;k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function files(root) {
  let result = [];
  for (const e of fs.readdirSync(root, {withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:1)) {
    const p=path.join(root,e.name);
    if(e.isSymbolicLink()) throw Error('Symlink is not permitted: '+p);
    result.push(...(e.isDirectory()?files(p):[p]));
  }
  return result;
}
function extractZip(archive, destination) {
  const zip=fs.readFileSync(archive);
  let end=-1;
  for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--) if(zip.readUInt32LE(i)===0x06054b50){end=i;break;}
  if(end<0) throw Error('ZIP directory missing');
  if(zip.readUInt16LE(end+4)||zip.readUInt16LE(end+6))throw Error('Split ZIP unsupported');
  let offset=zip.readUInt32LE(end+16);const count=zip.readUInt16LE(end+10),seen=new Set();
  for(let i=0;i<count;i++){
    if(zip.readUInt32LE(offset)!==0x02014b50)throw Error('Invalid ZIP entry');
    const method=zip.readUInt16LE(offset+10),crc=zip.readUInt32LE(offset+16),length=zip.readUInt32LE(offset+20),size=zip.readUInt32LE(offset+24),nl=zip.readUInt16LE(offset+28),el=zip.readUInt16LE(offset+30),cl=zip.readUInt16LE(offset+32),start=zip.readUInt32LE(offset+42);
    const name=zip.subarray(offset+46,offset+46+nl).toString('utf8').replaceAll('\\','/');
    if(name.startsWith('/')||name.includes(':')||name.split('/').includes('..')||seen.has(name))throw Error('Unsafe ZIP path');
    if(((zip.readUInt32LE(offset+38)>>>16)&0xf000)===0xa000)throw Error('ZIP symlink rejected');
    seen.add(name);const output=path.resolve(destination,name);
    if(!output.startsWith(path.resolve(destination)+path.sep))throw Error('ZIP path escaped destination');
    if(name.endsWith('/'))fs.mkdirSync(output,{recursive:true});
    else {
      if(size>128*1024*1024)throw Error('Oversized ZIP member');
      if(zip.readUInt32LE(start)!==0x04034b50)throw Error('Invalid local ZIP header');
      const dataStart=start+30+zip.readUInt16LE(start+26)+zip.readUInt16LE(start+28),packed=zip.subarray(dataStart,dataStart+length);
      const bytes=method===0?packed:method===8?zlib.inflateRawSync(packed,{maxOutputLength:size}):null;
      if(!bytes||bytes.length!==size||crc32(bytes)!==crc)throw Error('ZIP integrity failed: '+name);
      fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,bytes);
    }
    offset+=46+nl+el+cl;
  }
}
function makeZip(directory, output) {
  const root=path.dirname(directory),locals=[],central=[];let offset=0;
  for(const p of files(directory)){
    const name=Buffer.from(path.relative(root,p).replaceAll('\\','/')),bytes=fs.readFileSync(p),packed=zlib.deflateRawSync(bytes,{level:9}),crc=crc32(bytes);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(packed.length,18);header.writeUInt32LE(bytes.length,22);header.writeUInt16LE(name.length,26);
    const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(packed.length,20);c.writeUInt32LE(bytes.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);
    locals.push(header,name,packed);central.push(c,name);offset+=header.length+name.length+packed.length;
  }
  const directoryBytes=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(central.length/2,8);end.writeUInt16LE(central.length/2,10);end.writeUInt32LE(directoryBytes.length,12);end.writeUInt32LE(offset,16);fs.writeFileSync(output,Buffer.concat([...locals,directoryBytes,end]));
}
module.exports={sha,files,crc32,extractZip,makeZip};
