// functions/api/register.js

// === 🔑 MODIFICA CRITICA: USARE BCrypt-TS PER COMPATIBILITÀ CON CLOUDFLARE PAGES BUILD 🔑 ===
import { hash } from 'bcryptjs'; 

// Funzione principale che risponde alla richiesta HTTP
export async function onRequestPOST({ request, env }) {
    
    // Assicurati che env.DB sia configurato come binding del tuo database D1
    if (!env.DB) {
        return new Response(JSON.stringify({ message: 'Database non configurato.' }), { status: 500 });
    }

    try {
        const { username, email, password } = await request.json();

        if (!username || !email || !password || password.length < 8) {
            return new Response(JSON.stringify({ message: 'Dati mancanti o password troppo corta.' }), { status: 400 });
        }

        // 1. Controllo duplicati (Opzionale, ma consigliato)
        const check = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE username = ? OR email = ?")
                                 .bind(username, email)
                                 .all();
        if (check.results[0].count > 0) {
            return new Response(JSON.stringify({ message: 'Username o Email già in uso.' }), { status: 409 });
        }

        // === 🔐 PASSO CRITICO: HASHING DELLA PASSWORD REALE CON BCrypt 🔐 ===
        // L'utilizzo del fattore di costo 10 è corretto
        const hashedPassword = await hash(password, 10); 

        // ----------------------------------------------------------------------

        // 2. Inserimento Utente (Role di default: 'team_member')
        const result = await env.DB.prepare(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
        ).bind(username, email, hashedPassword, 'team_member').run();

        // 3. Risposta di Successo
        return new Response(JSON.stringify({ 
            message: 'Registrazione completata. Puoi effettuare il login.',
            userId: result.meta.lastRowId
        }), { 
            status: 201, // 201 Created
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        return new Response(JSON.stringify({ message: 'Errore interno durante la registrazione o l\'hashing.' }), { status: 500 });
    }
}