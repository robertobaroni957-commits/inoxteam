// functions/api/login.js

import { compare } from 'bcrypt-ts';
import * as jose from 'jose';

// Durata del token (24 ore in secondi)
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24;
const ALG = 'HS256';

export async function onRequestPOST({ request, env }) {
    
    if (!env.DB || !env.JWT_SECRET) {
        // Questa condizione dovrebbe essere superata (configurazione OK)
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

        // 2. Confronta la password con l'hash salvato
        // 🚨 LOGICA RIABILITATA: Se l'errore è qui, il Worker si rompe.
        let isPasswordValid = false;
        try {
            isPasswordValid = await compare(password, user.password_hash); 
        } catch (bcryptError) {
            // Se compare() fallisce internamente (es. hash non valido), logghiamo l'errore specifico
            console.error('ERRORE BCrypt COMPARE:', bcryptError.message);
            // Non forniamo dettagli al client per motivi di sicurezza
            return new Response(JSON.stringify({ message: 'Credenziali non valide.' }), { status: 401 });
        }

        if (!isPasswordValid) {
             return new Response(JSON.stringify({ message: 'Credenziali non valide.' }), { status: 401 });
        }

        // 3. Firma il Token con JOSE
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
        // Questo catch ora cattura solo errori nel DB o nella generazione del JWT
        console.error('Errore critico durante il login:', error.message);
        return new Response(JSON.stringify({ message: 'Errore interno del server.' }), { status: 500 });
    }
}