// mwt_page_logic.js

document.addEventListener('DOMContentLoaded', () => {




    let tourStages = []; // Declare tourStages as a mutable variable

    // Function to load tour stages
    const loadTourStages = async () => {
        try {
            const response = await fetch('stages.json'); // Fetch from new JSON file
            if (!response.ok) throw new Error(`File non trovato: stages.json`);
            tourStages = await response.json(); // Assign fetched data to tourStages

            // Now that tourStages is loaded, initialize dependent functions
            initCountdown();
            initChart();
            populateFilters();
            renderStages();
        } catch (error) {
            console.error("Errore caricamento tappe del tour:", error);
            // Optionally display an error message on the page
            document.getElementById('stage-list').innerHTML = `<p class="text-red-500 text-lg p-10">Impossibile caricare le tappe del tour. (Dettaglio: ${error.message})</p>`;
        }
    };

    // Utility functions for stages
    const formatDate = (dateString) => { const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }; return new Date(dateString).toLocaleDateString('it-IT', options); };
    const getTypeIcon = (type) => { type = type.toLowerCase(); if (type.includes('flat')) return '⚡'; if (type.includes('mountain')) return '🏔️'; if (type.includes('hilly')) return '⛰️'; if (type.includes('luna park')) return '🔄'; if (type.includes('itt') || type.includes('chrono scalata')) return '⏱️'; return '🚴'; };
    const getTypeColor = (type) => { type = type.toLowerCase(); if (type.includes('flat')) return 'text-race-flat'; if (type.includes('mountain')) return 'text-race-mountain'; if (type.includes('hilly')) return 'text-race-hilly'; return 'text-race-time'; };

    // Function definitions for countdown, chart, filters, and stages
    function initCountdown() {
        const countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const nextRace = tourStages.find(stage => new Date(stage.date).getTime() > now);
            let distance;
            let countdownText = '';
            let mainMessage = '';

            if (nextRace) {
                distance = new Date(nextRace.date).getTime() - now;
                countdownText = `PROSSIMA GARA: ${formatDate(nextRace.date)} - ${nextRace.route} (${nextRace.world})`;
                mainMessage = `PROSSIMA GARA:`;
            } else {
                const firstStageDate = new Date(tourStages[0].date).getTime();
                if (now >= firstStageDate) {
                     mainMessage = 'TOUR IN CORSO O COMPLETATO';
                     countdownText = 'Tutte le gare sono state completate!';
                     distance = -1;
                } else {
                    distance = firstStageDate - now;
                    countdownText = `INIZIO TOUR TRA: ${formatDate(tourStages[0].date)} - ${tourStages[0].route} (${tourStages[0].world})`;
                    mainMessage = `INIZIO TOUR TRA:`;
                }
            }

            if (distance < 0) {
                clearInterval(countdownInterval);
                document.getElementById('days').innerText = '00';
                document.getElementById('hours').innerText = '00';
                document.getElementById('minutes').innerText = '00';
                document.getElementById('seconds').innerText = '00';
                document.getElementById('next-race-info').innerText = mainMessage;
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
            document.getElementById('next-race-info').innerHTML = countdownText;

        }, 1000);
    }

    function initChart() {
        const raceTypes = tourStages.map(stage => stage.type);
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
        const worlds = [...new Set(tourStages.map(stage => stage.world))];
        const types = [...new Set(tourStages.map(stage => stage.type))];

        const worldFilter = document.getElementById('worldFilter');
        worlds.forEach(world => {
            const option = document.createElement('option');
            option.value = world;
            option.textContent = world;
            worldFilter.appendChild(option);
        });

        const typeFilter = document.getElementById('typeFilter');
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
        stageList.innerHTML = ''; // Clear previous stages

        const worldFilter = document.getElementById('worldFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        const filteredStages = tourStages.filter(stage => {
            const matchesWorld = (worldFilter === 'all' || stage.world === worldFilter);
            const matchesType = (typeFilter === 'all' || stage.type === typeFilter);
            return matchesWorld && matchesType;
        });

        if (filteredStages.length === 0) {
            stageList.innerHTML = `<p class="text-gray-400 text-center py-8">Nessuna tappa trovata per i filtri selezionati.</p>`;
            return;
        }

        filteredStages.forEach(stage => {
            const stageCardHtml = `
                <div class="bg-zwift-dark p-4 rounded-lg border border-gray-700 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer stage-card" data-stage-id="${stage.id}">
                    <div class="mb-3 md:mb-0">
                        <h3 class="text-xl font-bold text-zwift-orange font-display">Tappa ${stage.id}: ${stage.route}</h3>
                        <p class="text-gray-400 text-sm">${formatDate(stage.date)}</p>
                        <p class="text-gray-300 text-sm">${stage.world} - <span class="${getTypeColor(stage.type)} font-semibold">${getTypeIcon(stage.type)} ${stage.type}</span></p>
                    </div>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <a href="${stage.routeLink}" target="_blank" class="bg-zwift-card hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm transition text-center flex items-center justify-center">
                            <i class="fas fa-route mr-2"></i> Dettagli Percorso
                        </a>
                        <a href="${stage.registerLink}" target="_blank" class="bg-zwift-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded text-sm transition text-center flex items-center justify-center">
                            <i class="fas fa-clipboard-list mr-2"></i> Iscriviti
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

        const segmentsHtml = stage.segments && stage.segments.length > 0 ?
            `<div class="mt-4">
                <h4 class="text-xl font-bold text-zwift-blue font-display mb-2">Segmenti Rilevanti:</h4>
                <ul class="list-disc list-inside text-gray-300 ml-4">
                    ${stage.segments.map(segment => `<li>${segment}</li>`).join('')}
                </ul>
            </div>` : '';

        let modalContent = `
            <div class="bg-zwift-card p-6 rounded-xl border border-gray-800 shadow-lg w-11/12 max-w-2xl relative">
                <button class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl" id="close-event-modal">&times;</button>
                <h3 class="text-3xl font-bold text-zwift-orange font-display mb-4">Tappa ${stage.id}: ${stage.route}</h3>
                <p class="text-gray-300 text-lg mb-2"><strong>Data:</strong> ${formatDate(stage.date)}</p>
                <p class="text-gray-300 text-lg mb-2"><strong>Mondo:</strong> ${stage.world}</p>
                <p class="text-gray-300 text-lg mb-4"><strong>Tipo:</strong> <span class="${getTypeColor(stage.type)} font-semibold">${getTypeIcon(stage.type)} ${stage.type}</span></p>

                ${segmentsHtml}

                <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
                    <a href="${stage.routeLink}" target="_blank" class="bg-zwift-dark hover:bg-gray-700 text-white font-bold py-3 px-4 rounded text-center transition flex items-center justify-center text-base">
                        <i class="fas fa-route mr-2"></i> Dettagli Percorso
                    </a>
                    <a href="${stage.registerLink}" target="_blank" class="bg-zwift-orange hover:bg-orange-600 text-white font-bold py-3 px-4 rounded text-center transition flex items-center justify-center text-base">
                        <i class="fas fa-clipboard-list mr-2"></i> Iscriviti
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



    loadTourStages();
});