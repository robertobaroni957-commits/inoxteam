// mwt_page_logic.js

document.addEventListener('DOMContentLoaded', () => {
    const mainNavLinks = document.querySelectorAll('.bg-zwift-card > .container > div:nth-child(2) a');
    const sidebarLinks = document.querySelectorAll('#sidebar .sidebar-link');
    const allLinks = [...mainNavLinks, ...sidebarLinks];

    const sections = document.querySelectorAll('header[id], section[id], #leaders');

    // Smooth scrolling for all internal links
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const hash = this.hash;
            if (hash) {
                e.preventDefault();
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    history.pushState(null, null, hash); // Update URL hash without jumping
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Adjust for fixed header if any
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Intersection Observer for active link highlighting
    const observerOptions = {
        root: null, // viewport
        rootMargin: '-50% 0px -50% 0px', // Trigger when section is in the middle 50% of the viewport
        threshold: 0 // As soon as target enters/leaves root
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSectionId = entry.target.id;
                
                // Remove active classes from all links
                allLinks.forEach(link => {
                    link.classList.remove('text-zwift-orange', 'font-bold');
                    link.classList.add('hover:text-zwift-orange'); // Add hover back if removed
                });

                // Add active class to corresponding main nav link
                const mainNavLink = document.querySelector(`#nav-${currentSectionId}`);
                if (mainNavLink) {
                    mainNavLink.classList.add('text-zwift-orange', 'font-bold');
                    mainNavLink.classList.remove('hover:text-zwift-orange');
                }

                // Add active class to corresponding sidebar link
                const sidebarNavLink = document.querySelector(`#sidebar a[href="#${currentSectionId}"]`);
                if (sidebarNavLink) {
                    sidebarNavLink.classList.add('text-zwift-orange', 'font-bold');
                    sidebarNavLink.classList.remove('hover:text-zwift-orange');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle initial load - check hash in URL
    if (window.location.hash) {
        const initialTarget = document.querySelector(window.location.hash);
        if (initialTarget) {
            window.scrollTo({
                top: initialTarget.offsetTop - 80, // Adjust for fixed header
                behavior: 'smooth'
            });
        }
    }

    // Define jersey icons
    const jerseyIcons = {
        punti: '🟢', // Green jersey for points
        tempo: '⚪', // White jersey for general classification/time
        sprinter: '⚫', // Black jersey for sprint
        scalatore: '🔴'  // Red jersey for climber
    };

    // Define age category mapping
    const ageCategoryMap = {
        'A': '0-29',
        'B': '30-39',
        'C': '40-49',
        'D': '50-59',
        'E': '60+'
    };

    // Original page logic for stages, countdown, etc.
    const tourStages = [
        { id: 1, date: "2025-12-12T19:20:00", world: "Scotland", route: "Outer Scotland (2 laps - 22 km)", type: "Point Hilly", routeLink: "https://zwiftinsider.com/route/outer-scotland/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247620", segments: ["primo Champion Sprint solo FTS", "primo Breakaway Brae reverse solo FTS", "primo Clyde Kicker FAL e FTS", "secondo Champion Sprint FAL e FTS", "secondo Breakaway Brae reverse solo FAL", "secondo Clyde Kicker FAL e FTS", "terzo Champion Sprint FAL e FTS"] },
        { id: 2, date: "2025-12-16T19:20:00", world: "Makuri", route: "Red Zone Repeats (1 lap - 19.6 km - 87 mt +)", type: "iTT", routeLink: "https://zwiftinsider.com/route/red-zone-repeats/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247622", segments: [] },
        { id: 3, date: "2025-12-19T19:20:00", world: "New York", route: "Issendorf Express", type: "Luna Park", routeLink: "https://zwiftinsider.com/route/issendorf-express/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247623", segments: [] },
        { id: 4, date: "2025-12-23T19:20:00", world: "Scotland", route: "City and the Sgurr", type: "Point Mountain", routeLink: "https://zwiftinsider.com/route/city-and-the-sgurr/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247624", segments: [] },
        { id: 5, date: "2025-12-27T19:20:00", world: "Bologna", route: "Time Trial Lap", type: "Chrono Scalata", routeLink: "https://zwiftinsider.com/route/bologna-time-trial-lap/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247628", segments: [] },
        { id: 6, date: "2025-12-30T19:20:00", world: "London", route: "Classique Reverse", type: "Point Flat", routeLink: "https://zwiftinsider.com/route/classique-reverse/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247630", segments: [] },
        { id: 7, date: "2026-02-13T19:20:00", world: "Makuri", route: "Sprinter's Playground", type: "Luna Park", routeLink: "https://zwiftinsider.com/route/sprinters-playground/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247687", segments: [] },
        { id: 8, date: "2026-02-17T19:20:00", world: "London", route: "London Uprising", type: "Point Mountain", routeLink: "https://zwiftinsider.com/route/london-uprising/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247689", segments: [] },
        { id: 9, date: "2026-02-20T19:20:00", world: "Watopia", route: "Flat Out Fast", type: "iTT", routeLink: "https://zwiftinsider.com/route/flat-out-fast/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247692", segments: [] },
        { id: 10, date: "2026-02-24T19:20:00", world: "France", route: "Bon Voyage", type: "Point Flat", routeLink: "https://zwiftinsider.com/route/bon-voyage/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247696", segments: [] },
        { id: 11, date: "2026-02-27T19:20:00", world: "Watopia", route: "Mountain Mash", type: "Chrono Scalata", routeLink: "https://zwiftinsider.com/route/mountain-mash/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247700", segments: [] },
        { id: 12, date: "2026-03-04T19:20:00", world: "Richmond", route: "Cobbled Climbs Reverse", type: "Point Hilly", routeLink: "https://zwiftinsider.com/route/cobbled-climbs-reverse/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247701", segments: [] },
        { id: 13, date: "2026-03-07T19:20:00", world: "London", route: "London Flat", type: "iTT", routeLink: "https://zwiftinsider.com/route/london-flat/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247703", segments: [] },
        { id: 14, date: "2026-03-11T19:20:00", world: "New York", route: "Toefield Tormado", type: "Luna Park", routeLink: "https://zwiftinsider.com/route/toefield-tormado/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247705", segments: [] },
        { id: 15, date: "2026-03-14T19:20:00", world: "Watopia", route: "Power Punches", type: "Point Mountain", routeLink: "https://zwiftinsider.com/route/power-punches/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247707", segments: [] },
        { id: 16, date: "2026-03-18T19:20:00", world: "Makuri", route: "Electric Loop", type: "Point Flat", routeLink: "https://zwiftinsider.com/route/electric-loop/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247709", segments: [] },
        { id: 17, date: "2026-03-21T19:20:00", world: "France", route: "Ven-10", type: "Chrono Scalata", routeLink: "https://zwiftinsider.com/route/ven-10/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247710", segments: [] },
        { id: 18, date: "2026-03-25T19:20:00", world: "Watopia", route: "Jarvis Seaside Sprint", type: "Point Hilly", routeLink: "https://zwiftinsider.com/route/jarvis-seaside-sprint/", registerLink: "https://www.zwift.com/eu-it/events/tag/inoxwinter/view/5247712", segments: [] }
    ];
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
                        <p class="text-gray-300 text-sm">${stage.world} - <span class="${getTypeColor(stage.type)} font-semibold">${getTypeIcon(type.includes('itt') ? 'Time Trial' : (type.includes('chrono scalata') ? 'Chrono Scalata' : stage.type))} ${stage.type}</span></p>
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

    // Call this once on DOMContentLoaded to set up initial listeners for elements that persist
    function setupModalListeners() {
        // This function can be expanded if there are other global elements that trigger the modal
        // or if modal-related listeners need to be attached outside of renderStages for any reason.
    }

    // RANKING LOGIC
    let currentCategory = 'A';
    let currentType = 'punti'; 
    let currentStage = 'cumulative'; 

    const secondsToHms = (d) => {
        if (d === undefined || d === null || isNaN(d) || d === 0) return "--:--:--";
        const h = Math.floor(d / 3600);
        const m = Math.floor((d % 3600) / 60);
        const s = Math.round(d % 60);
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    };

    const parseNameAndTeam = (fullName) => {
        let team = '';
        let name = fullName.trim();
        const regex = /\s*(\(|\[|&lt;)([^)\]&gt;]+)(\)|\]|&gt;)\s*$/;
        const match = name.match(regex);
        if (match) { team = match[2]; name = name.replace(match[0], '').trim(); }
        name = name.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\s*&#\d+;|\s*[\u2600-\u26FF]|\s*[\u2700-\u27BF]/g, '').trim();
        return { name, team: team || 'Individuale' };
    };

    const updateCategoryButtons = (activeCategory) => {
        document.querySelectorAll('.category-btn').forEach(button => {
            const categoryCode = button.dataset.category;
            button.textContent = ageCategoryMap[categoryCode] || categoryCode; // Display age range
            if (categoryCode === activeCategory) {
                button.classList.add('bg-zwift-orange', 'font-bold'); button.classList.remove('bg-zwift-card');
            } else {
                button.classList.add('bg-zwift-card'); button.classList.remove('bg-zwift-orange', 'font-bold');
            }
        });
    };

    const updateTypeButtons = (activeType) => {
        document.querySelectorAll('.type-btn').forEach(button => {
            if (button.dataset.type === activeType) {
                button.classList.add('bg-zwift-orange', 'font-bold'); button.classList.remove('bg-zwift-card');
            } else {
                button.classList.add('bg-zwift-card'); button.classList.remove('bg-zwift-orange', 'font-bold');
            }
        });
    };
    
    const renderRankingTable = (data, type, category, stage) => {
        const isCumulative = (stage === 'cumulative');
        let title, headers, scoreKey, unit;

        const singleRaceKeys = { punti: 'punti_total', tempo: 'tempo_time', sprinter: 'sprinter_points', scalatore: 'climber_points' };
        const cumulativeKeys = { punti: 'total', tempo: 'time', sprinter: 'pts_sprint', scalatore: 'pts_kom' };

        if (type === 'punti') { title = `Punti`; headers = ['Pos', 'Atleta', 'Squadra', 'Punti']; unit = ' Pts'; }
        else if (type === 'tempo') { title = `Tempo`; headers = ['Pos', 'Atleta', 'Squadra', 'Tempo']; unit = ''; }
        else if (type === 'sprinter') { title = `Punti Sprint`; headers = ['Pos', 'Atleta', 'Squadra', 'Punti Sprint']; unit = ' Pts'; }
        else if (type === 'scalatore') { title = `Punti Scalatore`; headers = ['Pos', 'Atleta', 'Squadra', 'Punti Scalata']; unit = ' Pts'; }
        else { return `<p class="text-red-500">Tipo classifica non valido.</p>`; }

        scoreKey = isCumulative ? cumulativeKeys[type] : singleRaceKeys[type];
        title = isCumulative ? `${title} Generali` : `Gara ${stage} - ${title}`;

        const sortedData = [...data].sort((a, b) => {
            const scoreA = a[scoreKey] || 0;
            const scoreB = b[scoreKey] || 0;
            if (type === 'tempo') { return (scoreA || Infinity) - (scoreB || Infinity); }
            return scoreB - scoreA;
        });

        const categoryDisplayName = ageCategoryMap[category] || category; // Get display name
        let html = `<h2 class="text-2xl text-zwift-blue mb-4 font-display">${title} - Cat. ${categoryDisplayName}</h2>
                    <div class="overflow-x-scroll"><table class="min-w-full table-fixed text-left whitespace-nowrap"><thead><tr class="bg-black/50">
                    ${headers.map(h => `<th class="px-4 py-2 border-b-2 border-zwift-orange">${h}</th>`).join('')}
                    </tr></thead><tbody>`;
        
        if (sortedData.length === 0) {
             html += `<tr><td colspan="${headers.length}" class="text-center py-8 text-gray-500">Nessun dato disponibile per questa selezione.</td></tr>`;
        } else {
            sortedData.forEach((athlete, index) => {
                let { name: athleteName, team } = parseNameAndTeam(athlete.name);
                const rank = index + 1;
                let scoreDisplay = athlete[scoreKey] || 0;
                if (type === 'tempo') { scoreDisplay = secondsToHms(scoreDisplay); }
                else { scoreDisplay += unit; }
                let rowStyle = '', rankColor = 'text-white', medalIcon = '';
                
                if (rank === 1) { 
                    rowStyle = 'background-color: rgba(255, 215, 0, 0.2);'; 
                    rankColor = 'text-yellow-400'; 
                    medalIcon = '🥇 ';
                    // Add jersey icon for the leader
                    athleteName = `<span class="jersey-icon">${jerseyIcons[type] || ''}</span> ${athleteName}`;
                }
                else if (rank === 2) { rowStyle = 'background-color: rgba(192, 192, 192, 0.2);'; rankColor = 'text-gray-300'; medalIcon = '🥈 '; }
                else if (rank === 3) { rowStyle = 'background-color: rgba(205, 127, 50, 0.2);'; rankColor = 'text-amber-500'; medalIcon = '🥉 '; }

                html += `<tr class="hover:bg-black/30" style="${rowStyle}">
                            <td class="px-4 py-3 font-bold ${rankColor}">${medalIcon}${rank}</td>
                            <td class="px-4 py-3 font-semibold text-white">${athleteName}</td>
                            <td class="px-4 py-3 text-gray-400">${team}</td>
                            <td class="px-4 py-3 font-bold text-zwift-orange">${scoreDisplay}</td>
                         </tr>`;
            });
        }
        html += `</tbody></table></div>`;
        return html;
    };

    const loadRanking = async (category, type, stage) => {
        currentCategory = category;
        currentType = type;
        currentStage = stage;
        
        updateCategoryButtons(category);
        updateTypeButtons(type);
        document.getElementById('selectGaraRanking').value = stage;
        
        const container = document.getElementById('ranking-container');
        container.innerHTML = `<div class="text-gray-500 absolute inset-0 flex items-center justify-center">Caricamento classifica...</div>`;
        
        try {
            const isCumulative = stage === 'cumulative';
            const dataUrl = isCumulative ? 'cumulative_results.json' : `gara_${stage}_results.json`;
            
            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error(`File non trovato: ${dataUrl}`);
            
            const allRankings = await response.json();
            
            let dataToRender;
            if (isCumulative) {
                dataToRender = allRankings[category] || [];
            } else {
                if (Array.isArray(allRankings)) {
                    dataToRender = allRankings.filter(rider => rider.category === category);
                } else if (typeof allRankings === 'object' && allRankings !== null) {
                    dataToRender = (allRankings[category] && allRankings[category][type]) ? allRankings[category][type] : [];
                } else {
                    throw new Error("Formato JSON della gara singola non riconosciuto.");
                }
            }
            
            container.innerHTML = renderRankingTable(dataToRender, type, category, stage);

        } catch (error) {
            console.error("Errore caricamento classifica:", error);
            container.innerHTML = `<p class="text-red-500 text-lg p-10">Impossibile caricare la classifica. Assicurati che i file JSON per la gara selezionata siano presenti nella directory principale. (Dettaglio: ${error.message})</p>`;
        }
    };

    // New function to render the "Leaders del Tour" section
    const renderLeadersSection = async () => {
        const categories = ['A', 'B', 'C', 'D', 'E'];
        const types = ['punti', 'tempo', 'sprinter', 'scalatore'];
        const dataUrl = 'cumulative_results.json';

        try {
            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error(`File non trovato: ${dataUrl}`);
            const allRankings = await response.json();

            for (const categoryCode of categories) {
                for (const type of types) {
                    const categoryRankings = allRankings[categoryCode] || [];
                    const scoreKey = (type === 'tempo') ? 'time' : ((type === 'sprinter') ? 'pts_sprint' : ((type === 'scalatore') ? 'pts_kom' : 'total'));

                    const leader = categoryRankings.reduce((best, current) => {
                        const currentScore = current[scoreKey] || 0;
                        if (type === 'tempo') {
                            return (currentScore < (best ? best[scoreKey] : Infinity)) ? current : best;
                        } else {
                            return (currentScore > (best ? best[scoreKey] : -Infinity)) ? current : best;
                        }
                    }, null);

                    const jerseyElement = document.getElementById(`leader-${type}-jersey-${categoryCode}`);
                    const nameElement = document.getElementById(`leader-${type}-name-${categoryCode}`);
                    const teamElement = document.getElementById(`leader-${type}-team-${categoryCode}`);
                    
                    if (leader) {
                        const { name: athleteName, team } = parseNameAndTeam(leader.name);
                        if (jerseyElement) jerseyElement.innerHTML = jerseyIcons[type];
                        if (nameElement) nameElement.innerText = athleteName;
                        if (teamElement) teamElement.innerText = team;
                    } else {
                        if (jerseyElement) jerseyElement.innerHTML = '❓';
                        if (nameElement) nameElement.innerText = 'N/A';
                        if (teamElement) teamElement.innerText = '';
                    }
                }
            }

        } catch (error) {
            console.error("Errore caricamento leaders:", error);
            document.getElementById('leaders-container').innerHTML = `<p class="text-red-500 text-lg p-10 col-span-full">Impossibile caricare i leaders. (Dettaglio: ${error.message})</p>`;
        }
    };


    const initRankingListeners = () => {
        const selectGaraRanking = document.getElementById('selectGaraRanking');
        const stageNames = Array.from({length: 18}, (_, i) => `Gara ${i + 1}`);
        stageNames.forEach((name, index) => {
            selectGaraRanking.appendChild(new Option(name, index + 1));
        });

        selectGaraRanking.addEventListener('change', (e) => {
            loadRanking(currentCategory, currentType, e.target.value);
        });

        document.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const stage = document.getElementById('selectGaraRanking').value;
                loadRanking(e.target.dataset.category, currentType, stage);
            });
        });
        
        document.querySelectorAll('.type-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const stage = document.getElementById('selectGaraRanking').value;
                loadRanking(currentCategory, e.target.dataset.type, stage); 
            });
        });
    };

    initCountdown();
    initChart();
    populateFilters();
    renderStages();
    initRankingListeners();
    loadRanking('A', 'punti', 'cumulative'); 
    renderLeadersSection(); // Call the new function to populate the leaders section
});