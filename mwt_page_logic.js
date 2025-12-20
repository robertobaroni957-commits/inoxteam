// mwt_page_logic.js

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling and active link highlighting
    const mainNavLinks = document.querySelectorAll('.bg-zwift-card > .container > div:nth-child(2) a');
    const sidebarLinks = document.querySelectorAll('#sidebar .sidebar-link');
    const allLinks = [...mainNavLinks, ...sidebarLinks];

    const sections = document.querySelectorAll('header[id], section[id], #leaders');

    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const hash = this.hash;
            if (hash) {
                e.preventDefault();
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    history.pushState(null, null, hash);
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSectionId = entry.target.id;

                allLinks.forEach(link => {
                    link.classList.remove('text-zwift-orange', 'font-bold');
                    link.classList.add('hover:text-zwift-orange');
                });

                const mainNavLink = document.querySelector(`#nav-${currentSectionId}`);
                if (mainNavLink) {
                    mainNavLink.classList.add('text-zwift-orange', 'font-bold');
                    mainNavLink.classList.remove('hover:text-zwift-orange');
                }

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

    if (window.location.hash) {
        const initialTarget = document.querySelector(window.location.hash);
        if (initialTarget) {
            window.scrollTo({
                top: initialTarget.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    }

    // Define jersey icons
    const jerseyIcons = {
        punti: '<img src="points.png" alt="Jersey Punti" class="w-12 h-12 mx-auto">',
        tempo: '<img src="time.png" alt="Jersey Generale" class="w-12 h-12 mx-auto">',
        sprinter: '<img src="sprint.png" alt="Jersey Sprinter" class="w-12 h-12 mx-auto">',
        scalatore: '<img src="climb.png" alt="Jersey Scalatore" class="w-12 h-12 mx-auto">'
    };

    // Define age category mapping
    const ageCategoryMap = {
        'A': '0-29',
        'B': '30-39',
        'C': '40-49',
        'D': '50-59',
        'E': '60+'
    };

    let tourStages = []; // Declare tourStages as a mutable variable
    let cumulativeResultsData = null; // To store cumulative results
    let zwidToFlagMap = {}; // Map to store zwid -> flag
    let zwidToTnameMap = {}; // Map to store zwid -> tname

    // Helper functions
    const secondsToHms = (d) => {
        if (d === undefined || d === null || isNaN(d) || d === 0) return "--:--:--";
        const h = Math.floor(d / 3600);
        const m = Math.floor((d % 3600) / 60);
        const s = Math.round(d % 60);
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    };

    // UI update functions
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

    // Ranking rendering functions (defined before loadRanking)
    const renderPodium = (data, type, category, stage) => {
        const podiumContainer = document.getElementById('podium-container-mwt');
        const isCumulative = (stage === 'cumulative');
        const singleRaceKeys = { punti: 'punti_total', tempo: 'tempo_time', sprinter: 'sprinter_points', scalatore: 'climber_points' };
        const cumulativeKeys = { punti: 'total', tempo: 'time', sprinter: 'pts_sprint', scalatore: 'pts_kom' };
        const scoreKey = isCumulative ? cumulativeKeys[type] : singleRaceKeys[type];

        const topRiders = [...data].sort((a, b) => {
            const scoreA = a[scoreKey] || 0;
            const scoreB = b[scoreKey] || 0;
            if (type === 'tempo') { return (scoreA || Infinity) - (scoreB || Infinity); }
            return scoreB - scoreA;
        }).slice(0, 3);

        if (topRiders.length === 0) {
            podiumContainer.innerHTML = '';
            return;
        }

        let podiumHtml = `
            <div class="text-center mb-8">
                <h3 class="text-3xl font-bold text-zwift-orange font-display">Podio - Cat. ${ageCategoryMap[category] || category}</h3>
                <p class="text-gray-400">Classifica: ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        `;

        const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
        const podiumStyles = {
            0: { place: '1st', medal: '🥇', color: 'text-yellow-400', height: 'pt-8' },
            1: { place: '2nd', medal: '🥈', color: 'text-gray-300', height: 'pt-4' },
            2: { place: '3rd', medal: '🥉', color: 'text-amber-500', height: '' }
        };

        podiumOrder.forEach(index => {
            if (topRiders[index]) {
                const rider = topRiders[index];
                const style = podiumStyles[index];
                let scoreDisplay = rider[scoreKey] || 0;
                if (type === 'tempo') { scoreDisplay = secondsToHms(scoreDisplay); } else { scoreDisplay += ' Pts'; }
                
                const flagHtml = rider.flag ? `<img src="https://flagcdn.com/w20/${rider.flag.toLowerCase()}.png" alt="${rider.flag}" class="inline h-5 mr-2">` : '';

                podiumHtml += `
                    <div class="bg-black/20 p-6 rounded-t-xl text-center ${style.height}">
                        <div class="text-5xl mb-2">${style.medal}</div>
                        <p class="text-2xl font-bold ${style.color} font-display">${rider.name}</p>
                        <p class="text-gray-400 text-sm mb-2">${rider.tname || 'N/A'}</p>
                        <p class="text-xl font-semibold text-white">${scoreDisplay}</p>
                        <p class="text-sm font-bold ${style.color}">${style.place}</p>
                    </div>
                `;
            } else {
                 podiumHtml += `<div></div>`; // Empty div for placeholder
            }
        });

        podiumHtml += `</div>`;
        podiumContainer.innerHTML = podiumHtml;
    };

    const renderRankingTable = (data, type, category, stage) => {
        const rankingContainer = document.getElementById('ranking-container');
        const isCumulative = (stage === 'cumulative');

        // Define keys for points
        const keys = {
            fal: isCumulative ? 'fal' : 'punti_fal',
            fts: isCumulative ? 'fts' : 'punti_fts',
            fin: isCumulative ? 'fin' : 'punti_fin',
            total: isCumulative ? 'total' : 'punti_total',
            time: isCumulative ? 'time' : 'tempo_time',
            sprinter: isCumulative ? 'pts_sprint' : 'sprinter_points',
            scalatore: isCumulative ? 'pts_kom' : 'climber_points'
        };

        const sortKey = (type === 'tempo') ? keys.time : (type === 'sprinter' ? keys.sprinter : (type === 'scalatore' ? keys.scalatore : keys.total));
        
        const sortedData = [...data].sort((a, b) => {
            const scoreA = a[sortKey] || 0;
            const scoreB = b[scoreKey] || 0;
            if (type === 'tempo') { return (scoreA || Infinity) - (scoreB || Infinity); }
            return scoreB - scoreA;
        });

        const categoryDisplayName = ageCategoryMap[category] || category;
        let tableHtml;

        if (type === 'punti' || type === 'sprinter' || type === 'scalatore') {
            // DETAILED POINTS VIEW
            const title = (type === 'punti') ? 'Punti Generali' : (type === 'sprinter' ? 'Punti Sprint' : 'Punti Scalatore');
            tableHtml = `<h2 class="text-2xl text-zwift-blue mb-4 font-display">Classifica ${title} - Cat. ${categoryDisplayName}</h2>
                         <div class="overflow-x-auto">
                             <table class="min-w-full text-left whitespace-nowrap">
                                 <thead><tr class="bg-black/50">
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">Pos</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">Atleta</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">Squadra</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">FAL</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">FTS</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">FIN</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange bg-black/50">Totale</th>
                                 </tr></thead><tbody>`;
            
            if (sortedData.length === 0) {
                tableHtml += `<tr><td colspan="7" class="text-center py-8 text-gray-500">Nessun dato disponibile.</td></tr>`;
            } else {
                sortedData.forEach((athlete, index) => {
                    const rank = index + 1;
                    const flagHtml = athlete.flag ? `<img src="https://flagcdn.com/w20/${athlete.flag.toLowerCase()}.png" alt="${athlete.flag}" class="inline h-4 mr-2 -translate-y-px">` : '<span class="inline-block w-5"></span>';
                    
                    tableHtml += `<tr class="hover:bg-black/30">
                                    <td class="px-4 py-3 font-bold">${rank}</td>
                                    <td class="px-4 py-3 font-semibold text-white">${flagHtml}${athlete.name}</td>
                                    <td class="px-4 py-3 text-gray-400">${athlete.tname || 'N/A'}</td>
                                    <td class="px-4 py-3">${athlete[keys.fal] || 0}</td>
                                    <td class="px-4 py-3">${athlete[keys.fts] || 0}</td>
                                    <td class="px-4 py-3">${athlete[keys.fin] || 0}</td>
                                    <td class="px-4 py-3 font-bold text-zwift-orange">${athlete[sortKey] || 0}</td>
                                 </tr>`;
                });
            }
            tableHtml += `</tbody></table></div>`;

        } else {
            // SIMPLE TIME VIEW
            tableHtml = `<h2 class="text-2xl text-zwift-blue mb-4 font-display">Classifica a Tempo - Cat. ${categoryDisplayName}</h2>
                         <div class="overflow-x-auto">
                             <table class="min-w-full text-left whitespace-nowrap">
                                 <thead><tr class="bg-black/50">
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">Pos</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">Atleta</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">Squadra</th>
                                     <th class="px-4 py-2 border-b-2 border-zwift-orange">Tempo</th>
                                 </tr></thead><tbody>`;

            if (sortedData.length === 0) {
                tableHtml += `<tr><td colspan="4" class="text-center py-8 text-gray-500">Nessun dato disponibile.</td></tr>`;
            } else {
                sortedData.forEach((athlete, index) => {
                    const rank = index + 1;
                    const flagHtml = athlete.flag ? `<img src="https://flagcdn.com/w20/${athlete.flag.toLowerCase()}.png" alt="${athlete.flag}" class="inline h-4 mr-2 -translate-y-px">` : '<span class="inline-block w-5"></span>';
                    
                    tableHtml += `<tr class="hover:bg-black/30">
                                    <td class="px-4 py-3 font-bold">${rank}</td>
                                    <td class="px-4 py-3 font-semibold text-white">${flagHtml}${athlete.name}</td>
                                    <td class="px-4 py-3 text-gray-400">${athlete.tname || 'N/A'}</td>
                                    <td class="px-4 py-3 font-bold text-zwift-orange">${secondsToHms(athlete[keys.time])}</td>
                                 </tr>`;
                });
            }
            tableHtml += `</tbody></table></div>`;
        }

        rankingContainer.innerHTML = tableHtml;
    };

    const loadRanking = async (category, type, stage) => {
        currentCategory = category;
        currentType = type;
        currentStage = stage;

        updateCategoryButtons(category);
        updateTypeButtons(type);
        document.getElementById('selectGaraRanking').value = stage;

        const rankingContainer = document.getElementById('ranking-container');
        rankingContainer.innerHTML = `<div class="text-gray-500 absolute inset-0 flex items-center justify-center">Caricamento classifica...</div>`;
        document.getElementById('podium-container-mwt').innerHTML = ''; // Clear podium

        try {
            const isCumulative = stage === 'cumulative';
            let dataToRender = [];

            if (isCumulative) {
                // Use pre-loaded cumulative data
                dataToRender = cumulativeResultsData.results[category] || [];
            } else {
                // Fetch single race data
                const dataUrl = `gara_${stage}_results.json`;
                const response = await fetch(dataUrl);
                if (!response.ok) throw new Error(`File non trovato: ${dataUrl}`);
                const allRankings = await response.json();
                
                // Filter by category and enrich with flag/tname
                if (Array.isArray(allRankings)) {
                    dataToRender = allRankings
                        .filter(rider => rider.category === category)
                        .map(rider => ({
                            ...rider,
                            flag: zwidToFlagMap[rider.zwid] || '',
                            tname: zwidToTnameMap[rider.zwid] || ''
                        }));
                } else {
                    throw new Error("Formato JSON della gara singola non riconosciuto.");
                }
            }
            
            // Render both podium and table
            renderPodium(dataToRender, type, category, stage);
            renderRankingTable(dataToRender, type, category, stage);

        } catch (error) {
            console.error("Errore caricamento classifica:", error);
            rankingContainer.innerHTML = `<p class="text-red-500 text-lg p-10">Impossibile caricare la classifica. (Dettaglio: ${error.message})</p>`;
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
                    const categoryRankings = allRankings.results[categoryCode] || [];
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

    loadTourStages();
});