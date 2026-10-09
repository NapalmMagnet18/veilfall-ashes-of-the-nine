// Run with Node.js or Bun. Supply the encrypted JSON, private 32-byte key file,
// and a NEW local output path. This only decrypts; it never writes a live game DB.
const fs=require('fs'),crypto=require('crypto');
const [encryptedPath,keyPath,outputPath]=process.argv.slice(2);
if(!encryptedPath||!keyPath||!outputPath)throw Error('Usage: node Restore-VEILFALL-Gameplay.cjs encrypted.json private-key.bin new-output.json');
const data=JSON.parse(fs.readFileSync(encryptedPath,'utf8')),key=fs.readFileSync(keyPath);
if(data.format!=='veilfall-gameplay-backup-v1'||data.algorithm!=='AES-256-GCM'||key.length!==32)throw Error('Unsupported backup format or key length');
const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(data.nonce,'base64'));
decipher.setAuthTag(Buffer.from(data.tag,'base64'));
const plain=Buffer.concat([decipher.update(Buffer.from(data.ciphertext,'base64')),decipher.final()]);
JSON.parse(plain.toString('utf8'));
fs.writeFileSync(outputPath,plain,{flag:'wx',mode:0o600});
console.log('Authenticated gameplay snapshot restored to the new local output file.');
