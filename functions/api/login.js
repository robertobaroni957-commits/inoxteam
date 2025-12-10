// functions/api/login.js

import * as jose from 'jose'; 

// Durata del token (24 ore in secondi)
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24;
const ALG = 'HS256';

// Usiamo l'handler generico che hai fornito, ma senza next non usato.
export async function onRequest({ request, env }) { 
    
    // Controlliamo ESPLICITAMENTE il metodo per essere sicuri
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed: Usa POST per il login.', { status: 405 });
    }

    if (!env.DB || !env.JWT_SECRET) {
        return new Response(JSON.stringify({ message: 'Server configuration error (DB/Secret mancante).' }), { status: 500 });
    }

    try {
        const { email, password } = await request.json();
        
        // 1. Cerca l'utente
        const { results } = await env.DB.prepare(
            "SELECT id, username, password_hash, role FROM users WHERE email = ?"
        ).bind(email).all();

        const user = results[0];
        if (!user) {
             return new Response(JSON.stringify({ message: 'Credenziali non valide.' }), { status: 401 });
        }

        // 2. BYPASS TOTALE DEL CONFRONTO PASSWORD PER DIAGNOSI DEL 405
        // 🚨 Il login è sempre VERO se l'utente esiste. 
        const isPasswordValid = true; 
        
        if (!isPasswordValid) { // Questa riga non verrà mai eseguita
             return new Response(JSON.stringify({ message: 'Credenziali non valide.' }), { status: 401 });
        }

        // 3. Firma il Token con JOSE (Il codice è corretto qui)
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role
        };
        const secret = new TextEncoder().encode(env.JWT_SECRET);

        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: ALG })
            .setIssuedAt()
            .setExpirationTime(`${TOKEN_EXPIRY_SECONDS}s`) 
            .sign(secret);
        
        // 4. Risposta di Successo
        const redirectToPath = user.role === 'admin' ? '/dashboard.html' : '/eventi.html';

        return new Response(JSON.stringify({ 
            message: 'Login effettuato con successo.',
            token: token,
            redirectTo: redirectToPath
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        // Cattura gli errori solo se il DB fallisce o la generazione JWT fallisce
        console.error('Errore critico (DB/JWT) durante il login:', error.message);
        return new Response(JSON.stringify({ message: 'Errore interno del server.' }), { status: 500 });
    }
}