// functions/_middleware.js - VERSIONE CONGELATA PER ACCESSO LIBERO

export async function onRequest({ request, next, env }) {
    
    // === 🛑 DISATTIVAZIONE AUTENTICAZIONE ===
    // Fai in modo che il middleware restituisca sempre la richiesta successiva
    // bypassando la logica di verifica del token.
    
    console.log('Middleware: JWT check bypassato (Accesso Libero).');
    
    return next();
    // =======================================
}