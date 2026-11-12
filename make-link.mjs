import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { randomBytes, createCipheriv } from 'node:crypto';

const args = process.argv.slice(2);
const sealAt = args.indexOf('--seal');
const sealDir = sealAt >= 0 ? args[sealAt + 1] : '';
const positional = sealAt < 0 ? args : args.filter((_, i) => i !== sealAt && i !== sealAt + 1);
const [file, url] = positional;
if (!file || !url || (sealAt >= 0 && !sealDir)) {
  console.error('사용법: node make-link.mjs 검수판.json https://검수할-화면-주소 [--seal 저장할-폴더]');
  process.exit(1);
}
const spec = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(spec.items) || !spec.items.length) {
  console.error('검수판.json 에 items 가 없습니다');
  process.exit(1);
}
const packed = deflateRawSync(Buffer.from(JSON.stringify(spec), 'utf8'));
const page = url.split('#')[0];
if (sealAt < 0) {
  console.log(`${page}#qa-review=1.${packed.toString('base64url')}`);
  process.exit(0);
}
const name = randomBytes(10).toString('hex');
const key = randomBytes(32);
const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const sealed = Buffer.concat([iv, cipher.update(packed), cipher.final(), cipher.getAuthTag()]);
mkdirSync(sealDir, { recursive: true });
writeFileSync(join(sealDir, `${name}.bin`), sealed);
console.log(JSON.stringify({ link: `${page}#qa-review=2.${name}.${key.toString('base64url')}`, file: `specs/${name}.bin` }));
