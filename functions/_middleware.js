// functions/_middleware.js

import * as jose from 'jose'; 

// Lista dei percorsi che NON richiedono un token JWT
const PUBLIC_ROUTES = [
    '/', 
    '/index.html',
    '/registrazione.html',
    // AGGIORNARE QUESTI PERCORSI SE HAI CAMBIATO IL NOME:
    '/api/login', 
    '/login_auth', // ⬅️ Assicurati che il tuo nuovo endpoint sia qui!
    '/api/register',
    '/home.html',
    '/chi_siamo.html',
    '/contatti.html',
    '/favicon.ico' 
];

const ALG = 'HS256'; 

export async function onRequest({ request, next, env }) {
    const url = new URL(request.url);

    // 1. Controllo se il percorso è pubblico
    if (PUBLIC_ROUTES.includes(url.pathname)) {
        return next();
    }

    // 2. Tenta di estrarre il Token (da Header O Cookie)
    const authHeader = request.headers.get('Authorization');
    const cookies = request.headers.get('Cookie'); // ⬅️ Ottiene l'intestazione Cookie
    
    // Prova prima a estrarre da Authorization (Bearer)
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // 🚨 AGGIUNGIAMO IL CONTROLLO COOKIE 🚨
    if (!token && cookies) {
        // Cerca il token nel formato 'inox_jwt=VALUE'
        const cookieMatch = cookies.match(/inox_jwt=([^;]+)/);
        if (cookieMatch) {
            token = cookieMatch[1];
        }
    }
    // 🚨 FINE CONTROLLO COOKIE 🚨

    request.data = { isAuthenticated: false }; // Inizializza oggetto dati

    if (!token) {
        // Se il token manca su una rotta privata (es. /eventi.html)
        if (url.pathname.endsWith('.html')) {
             // Redirige al login se si tenta di accedere a una pagina HTML protetta
            return Response.redirect(new URL('/index.html?auth_error=missing_token', request.url), 302);
        }
        // Blocca le chiamate API
        return new Response('Unauthorized: Token JWT mancante.', { status: 401 });
    }

    // 3. Verifica del Token con JOSE
    try {
        // ... (Logica di verifica esistente) ...
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        
        const { payload } = await jose.jwtVerify(token, secret, {
            algorithms: [ALG]
        });
        
        // Se la verifica riesce, allega i dati alla richiesta
        request.data.isAuthenticated = true;
        request.data.userId = payload.userId;
        request.data.username = payload.username;
        request.data.role = payload.role;
        
        return next();

    } catch (e) {
        console.error('Verifica JWT fallita:', e.message);
        // Token non valido, scaduto o corrotto
        if (url.pathname.endsWith('.html')) {
            return Response.redirect(new URL('/index.html?auth_error=invalid_token', request.url), 302);
        }
        return new Response('Forbidden: Token JWT non valido o scaduto.', { status: 403 });
    }
}