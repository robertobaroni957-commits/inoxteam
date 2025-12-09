// functions/api/login.js

import { compare } from 'bcryptjs';
import * as jose from 'jose'; 

// Durata del token (24 ore in secondi)
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; 
const ALG = 'HS256'; 

export async function onRequestPOST({ request, env }) {
    
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

        // 2. Confronta la password con l'hash salvato
        // === 🔐 CONFRONTO HASH BCrypt REALE 🔐 ===
        const isPasswordValid = await compare(password, user.password_hash); 
        // ===========================================

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
        return new Response(JSON.stringify({ 
            message: 'Login effettuato con successo.',
            token: token,
            redirectTo: user.role === 'admin' ? '/dashboard.html' : '/eventi.html'
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('Errore durante il login:', error);
        return new Response(JSON.stringify({ message: 'Errore interno del server.' }), { status: 500 });
    }
}