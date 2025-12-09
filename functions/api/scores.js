// functions/api/scores.js

// L'onRequest GET viene eseguita quando si accede all'URL /api/scores

export async function onRequestGET({ env, data }) {
    // 1. VERIFICA AUTORIZZAZIONE (Già eseguita dal Middleware)
    
    // Il Middleware ha aggiunto i dati decodificati del JWT (come 'userId', 'role') 
    // all'oggetto 'data'. Se 'data.isAuthenticated' è false o 'data.userId' è mancante, 
    // l'accesso sarebbe stato bloccato prima di arrivare qui.
    
    if (!data.isAuthenticated || !data.userId) {
        // Questa è una misura di sicurezza ridondante, il middleware dovrebbe bloccare l'accesso prima.
        return new Response(JSON.stringify({ message: 'Accesso negato. Token non valido.' }), { status: 403 });
    }

    // 2. LOGICA AUTORIZZATIVA (Esempio)
    
    // Possiamo controllare il ruolo dell'utente prima di fornire i dati sensibili.
    if (data.role !== 'admin' && data.role !== 'team_member') {
        return new Response(JSON.stringify({ message: 'Non hai i permessi necessari.' }), { status: 403 });
    }

    // 3. RECUPERO DATI DAL DATABASE D1 (Simulazione)
    
    try {
        // SIMULAZIONE: Query al DB per recuperare i punteggi
        // Nota: Qui recupereresti i dati reali da una tabella 'scores' o 'results' di D1.
        
        // Eseguiremo una query per dimostrazione
        const { results } = await env.DB.prepare(
            "SELECT username, role, created_at FROM users LIMIT 10"
        ).all();
        
        // Rimuoviamo il campo sensibile prima di inviare
        const safeResults = results.map(user => ({
            username: user.username,
            role: user.role,
            memberSince: new Date(user.created_at).toLocaleDateString('it-IT'),
            score: Math.floor(Math.random() * 500) + 500 // Punteggio simulato
        }));


        // 4. Risposta di Successo
        return new Response(JSON.stringify({ 
            status: 'success',
            requestedBy: data.username,
            role: data.role,
            data: safeResults 
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('Errore durante il recupero dei punteggi da D1:', error);
        return new Response(JSON.stringify({ message: 'Errore interno del server durante la query.' }), { status: 500 });
    }
}