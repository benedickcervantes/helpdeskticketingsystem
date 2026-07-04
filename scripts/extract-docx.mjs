import fs from 'fs';
import zlib from 'zlib';

const path = 'c:/Users/IT DEPT. 02/Documents/Federal-Pioneer-Corporate-Email-Policy-and-Standards-Manual-REVISED.docx';
const buf = fs.readFileSync(path);
let off = 0;

while (true) {
  const sig = buf.indexOf(Buffer.from('PK\x03\x04'), off);
  if (sig < 0) break;
  const nameLen = buf.readUInt16LE(sig + 26);
  const extraLen = buf.readUInt16LE(sig + 28);
  const compSize = buf.readUInt32LE(sig + 18);
  const name = buf.slice(sig + 30, sig + 30 + nameLen).toString();
  const dataStart = sig + 30 + nameLen + extraLen;
  if (name === 'word/document.xml') {
    const comp = buf.slice(dataStart, dataStart + compSize);
    const xml = zlib.inflateRawSync(comp).toString();
    const text = xml
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    fs.writeFileSync('c:/Users/IT DEPT. 02/Documents/helpdeskticketingsystem/scripts/template-text.txt', text);
    console.log(text.substring(0, 25000));
    break;
  }
  off = sig + 1;
}
