document.addEventListener('DOMContentLoaded', async () => {
    const getLang = () => localStorage.getItem('mwt_lang') || 'it';

    const translations = {
        'loading_ranking': { it: 'Caricamento classifica...', en: 'Loading ranking...' }, 'file_not_found': { it: 'File non trovato:', en: 'File not found:' },
        'error_loading_cumulative_data': { it: 'Errore caricamento dati cumulativi:', en: 'Error loading cumulative data:' },
        'invalid_ranking_type': { it: 'Tipo classifica non valido.', en: 'Invalid ranking type.' }, 'no_data_available': { it: 'Nessun dato disponibile per questa selezione.', en: 'No data available for this selection.' },
        'individual': { it: 'Individuale', en: 'Individual' }, 'error_loading_ranking': { it: 'Errore caricamento classifica:', en: 'Error loading ranking:' },
        'ensure_json_files': { it: 'Assicurati che i file JSON siano presenti.', en: 'Ensure JSON files are present.' },
        'unrecognized_json_format': { it: 'Formato JSON non riconosciuto.', en: 'Unrecognized JSON format.' },
        'pos': { it: 'Pos', en: 'Pos' }, 'athlete': { it: 'Atleta', en: 'Athlete' }, 'team': { it: 'Squadra', en: 'Team' }, 'points': { it: 'Punti', en: 'Points' },
        'time': { it: 'Tempo', en: 'Time' }, 'sprint_points': { it: 'Punti Sprint', en: 'Sprint Points' }, 'climb_points': { it: 'Punti Scalata', en: 'Climb Points' },
        'race_prefix': { it: 'Gara', en: 'Race' }, 'general_suffix': { it: 'Generali', en: 'General' },
        'cumulative_general': { it: 'Generale (Cumulata)', en: 'General (Cumulative)' }, 'time_ranking': { it: 'Tempo', en: 'Time' },
        'points_ranking': { it: 'Punti', en: 'Points' }, 'sprinter_ranking': { it: 'Punti Sprinter', en: 'Sprinter Points' },
        'climber_ranking': { it: 'Punti Scalatore', en: 'Climber Points' }
    };

    const t = (key) => {
        const lang = getLang();
        return translations[key]?.[lang] || translations[key]?.it || key;
    };

    const ageCategoryMap = {
        'OVERALL': 'Overall',
        'A': 'Cat A',
        'B': 'Cat B',
        'C': 'Cat C',
        'D': 'Cat D',
        'E': 'Cat E',
        'F': 'Cat F',
        'G': 'Cat G',
        'H': 'Cat H',
        'I': 'Cat I',
        'J': 'Cat J'
    };
    let currentCategory = 'OVERALL', currentType = 'tempo', currentStage = '';

    const formatTimeGun = (seconds) => {
        if (seconds === undefined || seconds === null || isNaN(seconds)) {
            return "--:--.---";
        }
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000);

        const pad = (num, length = 2) => String(num).padStart(length, '0');

        return `${pad(minutes)}:${pad(secs)}.${pad(milliseconds, 3)}`;
    };

    const renderRankingTable = (allRidersData, category) => {
        const headers = ['Pos', 'Atleta', 'Team', 'Tempo 1/3', 'Tempo 2/3', 'Tempo 3/3', 'Tempo Totale'];
        
        // Filtra per categoria (se non è 'Overall') e calcola i dati
        const categoryRiders = allRidersData
            .filter(rider => {
                if (category === 'OVERALL') {
                    return true; // Include tutti i rider se la categoria è Overall
                }
                return rider.category === category;
            })
            .map(rider => {
                const time1 = rider.times['1_3'];
                const time2 = rider.times['2_3'];
                const time3 = rider.times['3_3'];
                
                // Calcola il totale solo se tutti e tre i tempi sono presenti (non null/undefined)
                const totalTime = (time1 != null && time2 != null && time3 != null)
                    ? time1 + time2 + time3
                    : null;

                return { ...rider, totalTime };
            })
            .sort((a, b) => {
                // Gestisce i casi in cui il tempo totale non è calcolabile
                if (a.totalTime === null) return 1;
                if (b.totalTime === null) return -1;
                return a.totalTime - b.totalTime;
            });

        let html = `<div class="overflow-x-scroll"><table class="min-w-full table-auto text-left"><thead><tr class="bg-black/50">${headers.map(h => `<th class="px-4 py-2 border-b-2 border-zwift-orange">${h}</th>`).join('')}</tr></thead><tbody>`;
        
        if (categoryRiders.length === 0) {
            html += `<tr><td colspan="${headers.length}" class="text-center py-8 text-gray-500">${t('no_data_available')}</td></tr>`;
        } else {
            categoryRiders.forEach((athlete, index) => {
                const rank = index + 1;
                const medals = ['🥇', '🥈', '🥉'], medalIcon = rank <= 3 ? medals[rank - 1] : '';
                
                html += `<tr class="hover:bg-black/30">
                    <td class="px-4 py-3 font-bold">${medalIcon}${rank}</td>
                    <td class="px-4 py-3 font-semibold text-white">${athlete.name}</td>
                    <td class="px-4 py-3 text-gray-400">${athlete.tname || t('individual')}</td>
                    <td class="px-4 py-3 font-mono">${formatTimeGun(athlete.times['1_3'])}</td>
                    <td class="px-4 py-3 font-mono">${formatTimeGun(athlete.times['2_3'])}</td>
                    <td class="px-4 py-3 font-mono">${formatTimeGun(athlete.times['3_3'])}</td>
                    <td class="px-4 py-3 font-bold text-zwift-orange font-mono">${formatTimeGun(athlete.totalTime)}</td>
                </tr>`;
            });
        }
        html += `</tbody></table></div>`;
        return html;
    };

    const loadRanking = async (category, stage) => {
        currentCategory = category;
        currentStage = stage;
        
        const container = document.getElementById('ranking-container');
        container.innerHTML = `<div class="text-gray-500 absolute inset-0 flex items-center justify-center">${t('loading_ranking')}</div>`;
        
        const classificationUrl = `${stage}_classification.json`;

        try {
            const response = await fetch(classificationUrl);
            if (!response.ok) throw new Error(`${t('file_not_found')} (${stage}_classification.json)`);
            
            const allRidersData = await response.json();
            container.innerHTML = renderRankingTable(allRidersData, category);
            
            const eventDetailsContainer = document.getElementById('event-details-container');
            if (eventDetailsContainer) {
                eventDetailsContainer.style.display = 'none';
            }
            
        } catch (error) {
            console.error(t('error_loading_ranking'), error);
            container.innerHTML = `<p class="text-red-500 text-lg p-10">${t('error_loading_ranking')} (${error.message})</p>`;
        }
    };
    const selectGaraRanking = document.getElementById('selectGaraRanking');
    const selectCategory = document.getElementById('selectCategory');

    const populateSelect = (select, options) => {
        select.innerHTML = '';
        options.forEach(opt => select.appendChild(new Option(opt.text, opt.value)));
    };

    // Fetch list of races from the new API endpoint
    const fetchRaces = async () => {
        try {
            const response = await fetch('api_races.json');
            if (!response.ok) throw new Error(`${t('error_loading_cumulative_data')} api_races.json`);
            const races = await response.json();
            
            const raceOptions = []; // Rimosso l'elemento 'cumulative_general'
            races.forEach(race => {
                raceOptions.push({ text: race.title, value: race.id });
            });
            
            populateSelect(selectGaraRanking, raceOptions);

            // Imposta lo stato iniziale sulla prima gara disponibile, se ce n'è una
            if (races.length > 0) {
                currentStage = races[0].id;
                selectGaraRanking.value = currentStage;
                await loadRanking(currentCategory, currentStage); // Carica la classifica per la prima gara
            } else {
                // Gestisci il caso in cui non ci sono gare
                container.innerHTML = `<p class="text-gray-500 text-lg p-10">${t('no_data_available')}</p>`;
                renderEventDetails(null);
            }

        } catch (error) {
            console.error(t('error_loading_cumulative_data'), error);
            container.innerHTML = `<p class="text-red-500 text-lg p-10">${t('error_loading_ranking')} (${error.message})</p>`;
        }
    };


    await fetchRaces(); // Populate races on startup

    populateSelect(selectCategory, Object.keys(ageCategoryMap).map(key => ({ text: ageCategoryMap[key], value: key })));

    // Set initial values (if they exist from previous state)
    selectGaraRanking.value = currentStage;
    selectCategory.value = currentCategory;

    selectGaraRanking.onchange = (e) => loadRanking(currentCategory, e.target.value);
    selectCategory.onchange = (e) => loadRanking(e.target.value, currentStage);

    const setLanguage = async (lang) => {
        localStorage.setItem('mwt_lang', lang);
        document.documentElement.lang = lang;
        document.querySelectorAll('.lang-it').forEach(el => el.hidden = lang !== 'it');
        document.querySelectorAll('.lang-en').forEach(el => el.hidden = lang !== 'en');
        
        const langIcon = document.getElementById('lang-icon');
        if (langIcon) {
            langIcon.textContent = lang === 'it' ? '🇮🇹' : '🇬🇧';
        }
        await loadRanking(currentCategory, currentStage);
    };
    
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = getLang() === 'it' ? 'en' : 'it';
            setLanguage(newLang);
        });
    }
    
    // Initial load
    await setLanguage(getLang());
});
