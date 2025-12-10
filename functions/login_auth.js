// functions/login_auth.js

import { compare } from 'bcrypt-ts'; 
import * as jose from 'jose';

// Durata del token (24 ore in secondi)
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24;
const ALG = 'HS256';

// Usiamo onRequest per compatibilità, ma gestiamo solo il metodo POST
export async function onRequest({ request, env }) {
    
    // 1. Controllo del Metodo HTTP
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed: Usa POST per l\'accesso.' }), { status: 405 });
    }

    if (!env.DB || !env.JWT_SECRET) {
        return new Response(JSON.stringify({ message: 'Server configuration error (DB/Secret mancante).' }), { status: 500 });
    }

    try {
        const { email, password } = await request.json();
        
        // 2. Cerca l'utente
        const { results } = await env.DB.prepare(
            "SELECT id, username, password_hash, role FROM users WHERE email = ?"
        ).bind(email).all();

        const user = results[0];
        if (!user) {
             // Non specificare se è l'email o la password a essere sbagliata per sicurezza
             return new Response(JSON.stringify({ message: 'Credenziali non valide.' }), { status: 401 });
        }

        // 3. Confronta la password con l'hash salvato (Logica riattivata)
        let isPasswordValid = false;
        try {
            // Tentativo di confronto con la libreria bcrypt-ts
            isPasswordValid = await compare(password, user.password_hash); 
        } catch (bcryptError) {
            // Errore nella libreria BCrypt (es. hash corrotto/non valido)
            console.error('ERRORE BCrypt COMPARE:', bcryptError.message);
            return new Response(JSON.stringify({ message: 'Credenziali non valide.' }), { status: 401 });
        }

        if (!isPasswordValid) {
             return new Response(JSON.stringify({ message: 'Credenziali non valide.' }), { status: 401 });
        }

        // 4. Firma il Token con JOSE
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
        
        // 5. Risposta di Successo
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
        // Cattura errori di DB, parse JSON o generazione JWT
        console.error('Errore critico durante il login:', error.message);
        return new Response(JSON.stringify({ message: 'Errore interno del server.' }), { status: 500 });
    }
}