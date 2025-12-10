// hash_admin.js
import { hash } from 'bcrypt-ts'; 

// ⚠️ CAMBIARE QUESTA PASSWORD CON LA TUA SCELTA FINALE ⚠️
const ADMIN_PASSWORD = 'test123456'; 

async function generateHash() {
    const hashedPassword = await hash(ADMIN_PASSWORD, 10);
    console.log('\n================================================================');
    console.log('✅ HASH GENERATO (COPIA TUTTA LA STRINGA):');
    console.log(hashedPassword);
    console.log('================================================================');
}

generateHash();