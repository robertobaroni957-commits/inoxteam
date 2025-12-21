// mwt_page_logic.js

document.addEventListener('DOMContentLoaded', () => {

    let tourStages = [];

    // --- Localization ---
    const getLang = () => localStorage.getItem('mwt_lang') || 'it';
    
    const translations = {
        // Countdown
        'next_race': { it: 'PROSSIMA GARA:', en: 'NEXT RACE:' },
        'tour_starts_in': { it: 'INIZIO TOUR TRA:', en: 'TOUR STARTS IN:' },
        'tour_ongoing_or_completed': { it: 'TOUR IN CORSO O COMPLETATO', en: 'TOUR ONGOING OR COMPLETED' },
        'all_races_completed': { it: 'Tutte le gare sono state completate!', en: 'All races have been completed!' },
        'loading': { it: 'Caricamento...', en: 'Loading...' },
        // Filters
        'no_stages_found': { it: 'Nessuna tappa trovata per i filtri selezionati.', en: 'No stages found for the selected filters.' },
        // Stage Card
        'stage': { it: 'Tappa', en: 'Stage' },
        'route_details': { it: 'Dettagli Percorso', en: 'Route Details' },
        'register': { it: 'Iscriviti', en: 'Register' },
        // Modal
        'relevant_segments': { it: 'Segmenti Rilevanti:', en: 'Relevant Segments:' },
        'date': { it: 'Data', en: 'Date' },
        'world': { it: 'Mondo', en: 'World' },
        'type': { it: 'Tipo', en: 'Type' },
    };

    const t = (key) => {
        const lang = getLang();
        return translations[key] ? translations[key][lang] : key;
    };
    // --- End Localization ---

    const loadTourStages = async () => {
        try {
            const response = await fetch('stages.json');
            if (!response.ok) throw new Error(`File not found: stages.json`);
            tourStages = await response.json();
            
            initCountdown();
            populateFilters();
            renderStages();
            initChart(); // Moved here to ensure it runs after data is loaded
        } catch (error) {
            console.error("Error loading tour stages:", error);
            document.getElementById('stage-list').innerHTML = `<p class="text-red-500 text-lg p-10">Cannot load tour stages. (Detail: ${error.message})</p>`;
        }
    };

    const formatDate = (dateString) => {
        const lang = getLang();
        const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', options);
    };

    const getTypeIcon = (type) => { 
        const type_en = type.en || type;
        if (type_en.toLowerCase().includes('flat')) return '⚡'; 
        if (type_en.toLowerCase().includes('mountain')) return '🏔️'; 
        if (type_en.toLowerCase().includes('hilly')) return '⛰️'; 
        if (type_en.toLowerCase().includes('luna park')) return '🔄'; 
        if (type_en.toLowerCase().includes('itt') || type_en.toLowerCase().includes('climbing')) return '⏱️'; 
        return '🚴'; 
    };
    
    const getTypeColor = (type) => { 
        const type_en = type.en || type;
        if (type_en.toLowerCase().includes('flat')) return 'text-race-flat'; 
        if (type_en.toLowerCase().includes('mountain')) return 'text-race-mountain'; 
        if (type_en.toLowerCase().includes('hilly')) return 'text-race-hilly'; 
        return 'text-race-time'; 
    };
    
    const getTranslatedField = (field) => {
        const lang = getLang();
        return field[lang] || field.it || field;
    }


    function initCountdown() {
        // Set initial loading text
        const nextRaceInfoSpan = document.getElementById('next-race-info');
        if(nextRaceInfoSpan) {
            nextRaceInfoSpan.innerText = t('loading');
        }

        const countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const nextRace = tourStages.find(stage => new Date(stage.date).getTime() > now);
            let distance;
            let countdownText = '';

            if (nextRace) {
                distance = new Date(nextRace.date).getTime() - now;
                countdownText = `${t('next_race')} ${getTranslatedField(nextRace.route)} (${getTranslatedField(nextRace.world)})`;
            } else {
                const firstStage = tourStages[0];
                if (firstStage && new Date(firstStage.date).getTime() > now) {
                    distance = new Date(firstStage.date).getTime() - now;
                    countdownText = `${t('tour_starts_in')} ${formatDate(firstStage.date)}`;
                } else {
                    countdownText = t('all_races_completed');
                    distance = -1; // Indicates completion
                }
            }

            if (distance < 0) {
                clearInterval(countdownInterval);
                document.getElementById('days').innerText = '00';
                document.getElementById('hours').innerText = '00';
                document.getElementById('minutes').innerText = '00';
                document.getElementById('seconds').innerText = '00';
                if (nextRaceInfoSpan) {
                    nextRaceInfoSpan.innerText = t('tour_ongoing_or_completed');
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('days').innerText = String(days).padStart(2, '0');
            document.getElementById('hours').innerText = String(hours).padStart(2, '0');
            document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
            document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
            
            if(nextRaceInfoSpan) {
                nextRaceInfoSpan.innerText = countdownText;
            }
            
        }, 1000);
    }

    function initChart() {
        const lang = getLang();
        const raceTypes = tourStages.map(stage => getTranslatedField(stage.type));
        const typeCounts = raceTypes.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(typeCounts);
        const data = Object.values(typeCounts);
        const backgroundColors = [
            'rgba(16, 185, 129, 0.7)', // flat (green)
            'rgba(239, 68, 68, 0.7)',  // mountain (red)
            'rgba(245, 158, 11, 0.7)', // hilly (orange)
            'rgba(0, 240, 255, 0.7)',  // time (blue)
            'rgba(100, 100, 255, 0.7)' // Luna Park (purple)
        ];

        const ctx = document.getElementById('raceTypeChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: '#1e1e24',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0f0f0',
                            font: { size: 14 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                const total = tooltipItem.dataset.data.reduce((a, b) => a + b, 0);
                                const currentValue = tooltipItem.raw;
                                const percentage = ((currentValue / total) * 100).toFixed(1);
                                return `${tooltipItem.label}: ${currentValue} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function populateFilters() {
        const lang = getLang();
        const worlds = [...new Set(tourStages.map(stage => getTranslatedField(stage.world)))];
        const types = [...new Set(tourStages.map(stage => getTranslatedField(stage.type)))];

        const worldFilter = document.getElementById('worldFilter');
        // Clear existing options except the first one
        while (worldFilter.options.length > 1) {
            worldFilter.remove(1);
        }
        worlds.forEach(world => {
            const option = document.createElement('option');
            option.value = world;
            option.textContent = world;
            worldFilter.appendChild(option);
        });

        const typeFilter = document.getElementById('typeFilter');
        while (typeFilter.options.length > 1) {
            typeFilter.remove(1);
        }
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });

        worldFilter.addEventListener('change', () => renderStages());
        typeFilter.addEventListener('change', () => renderStages());
    }

    function renderStages() {
        const stageList = document.getElementById('stage-list');
        stageList.innerHTML = ''; 

        const worldFilterValue = document.getElementById('worldFilter').value;
        const typeFilterValue = document.getElementById('typeFilter').value;
        const lang = getLang();

        const filteredStages = tourStages.filter(stage => {
            const matchesWorld = (worldFilterValue === 'all' || getTranslatedField(stage.world) === worldFilterValue);
            const matchesType = (typeFilterValue === 'all' || getTranslatedField(stage.type) === typeFilterValue);
            return matchesWorld && matchesType;
        });

        if (filteredStages.length === 0) {
            stageList.innerHTML = `<p class="text-gray-400 text-center py-8">${t('no_stages_found')}</p>`;
            return;
        }

        filteredStages.forEach(stage => {
            const stageCardHtml = `
                <div class="bg-zwift-dark p-4 rounded-lg border border-gray-700 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer stage-card" data-stage-id="${stage.id}">
                    <div class="mb-3 md:mb-0">
                        <h3 class="text-xl font-bold text-zwift-orange font-display">${t('stage')} ${stage.id}: ${getTranslatedField(stage.route)}</h3>
                        <p class="text-gray-400 text-sm">${formatDate(stage.date)}</p>
                        <p class="text-gray-300 text-sm">${getTranslatedField(stage.world)} - <span class="${getTypeColor(stage.type)} font-semibold">${getTypeIcon(stage.type)} ${getTranslatedField(stage.type)}</span></p>
                    </div>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <a href="${stage.routeLink}" target="_blank" class="bg-zwift-card hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm transition text-center flex items-center justify-center">
                            <i class="fas fa-route mr-2"></i> ${t('route_details')}
                        </a>
                        <a href="${stage.registerLink}" target="_blank" class="bg-zwift-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded text-sm transition text-center flex items-center justify-center">
                            <i class="fas fa-clipboard-list mr-2"></i> ${t('register')}
                        </a>
                    </div>
                </div>
            `;
            stageList.innerHTML += stageCardHtml;
        });

        document.querySelectorAll('.stage-card').forEach(card => {
            card.addEventListener('click', (event) => {
                if (event.target.tagName === 'A' || event.target.closest('a')) {
                    return;
                }
                const stageId = parseInt(card.dataset.stageId);
                openStageModal(stageId);
            });
        });
    }

    function openStageModal(stageId) {
        const modal = document.getElementById('event-modal');
        const stage = tourStages.find(s => s.id === stageId);

        if (!stage) {
            console.error('Stage not found for ID:', stageId);
            return;
        }
        
        const lang = getLang();
        const segments = stage.segments.map(segment => getTranslatedField(segment));

        const segmentsHtml = segments && segments.length > 0 ?
            `<div class="mt-4">
                <h4 class="text-xl font-bold text-zwift-blue font-display mb-2">${t('relevant_segments')}</h4>
                <ul class="list-disc list-inside text-gray-300 ml-4">
                    ${segments.map(segment => `<li>${segment}</li>`).join('')}
                </ul>
            </div>` : '';

        let modalContent = `
            <div class="bg-zwift-card p-6 rounded-xl border border-gray-800 shadow-lg w-11/12 max-w-2xl relative">
                <button class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl" id="close-event-modal">&times;</button>
                <h3 class="text-3xl font-bold text-zwift-orange font-display mb-4">${t('stage')} ${stage.id}: ${getTranslatedField(stage.route)}</h3>
                <p class="text-gray-300 text-lg mb-2"><strong>${t('date')}:</strong> ${formatDate(stage.date)}</p>
                <p class="text-gray-300 text-lg mb-2"><strong>${t('world')}:</strong> ${getTranslatedField(stage.world)}</p>
                <p class="text-gray-300 text-lg mb-4"><strong>${t('type')}:</strong> <span class="${getTypeColor(stage.type)} font-semibold">${getTypeIcon(stage.type)} ${getTranslatedField(stage.type)}</span></p>

                ${segmentsHtml}

                <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
                    <a href="${stage.routeLink}" target="_blank" class="bg-zwift-dark hover:bg-gray-700 text-white font-bold py-3 px-4 rounded text-center transition flex items-center justify-center text-base">
                        <i class="fas fa-route mr-2"></i> ${t('route_details')}
                    </a>
                    <a href="${stage.registerLink}" target="_blank" class="bg-zwift-orange hover:bg-orange-600 text-white font-bold py-3 px-4 rounded text-center transition flex items-center justify-center text-base">
                        <i class="fas fa-clipboard-list mr-2"></i> ${t('register')}
                    </a>
                </div>
            </div>
        `;
        modal.innerHTML = modalContent;
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');

        document.getElementById('close-event-modal').addEventListener('click', closeStageModal);
    }

    function closeStageModal() {
        const modal = document.getElementById('event-modal');
        modal.classList.add('hidden');
        modal.innerHTML = '';
        document.body.classList.remove('overflow-hidden');
    }

    const refreshDynamicContent = () => {
        if (!tourStages.length) return; // Don't run if stages aren't loaded
        populateFilters();
        renderStages();
        initChart(); // Re-initialize chart with new language
    };
    
    // Listen for language changes from the main script
    document.addEventListener('languageChanged', refreshDynamicContent);

    loadTourStages();
});