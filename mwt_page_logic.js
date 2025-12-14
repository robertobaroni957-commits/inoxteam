// mwt_page_logic.js

document.addEventListener('DOMContentLoaded', () => {
    const mainNavLinks = document.querySelectorAll('.bg-zwift-card > .container > div:nth-child(2) a');
    const sidebarLinks = document.querySelectorAll('#sidebar .sidebar-link');
    const allLinks = [...mainNavLinks, ...sidebarLinks];

    const sections = document.querySelectorAll('header[id], section[id]');

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
            if (button.dataset.category === activeCategory) {
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

        let html = `<h2 class="text-2xl text-zwift-blue mb-4 font-display">${title} - Cat. ${category}</h2>
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
        const leadersData = {};

        try {
            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error(`File non trovato: ${dataUrl}`);
            const allRankings = await response.json();

            for (const type of types) {
                let bestAthlete = null;
                let bestScore = (type === 'tempo') ? Infinity : -Infinity;

                for (const category of categories) {
                    const categoryRankings = allRankings[category] || [];
                    const scoreKey = (type === 'tempo') ? 'time' : ((type === 'sprinter') ? 'pts_sprint' : ((type === 'scalatore') ? 'pts_kom' : 'total'));

                    // Find the leader in the current category for the current type
                    const leaderInCat = categoryRankings.reduce((leader, athlete) => {
                        const currentScore = athlete[scoreKey] || 0;
                        if (type === 'tempo') {
                            if (currentScore < (leader ? leader[scoreKey] : Infinity)) {
                                return athlete;
                            }
                        } else {
                            if (currentScore > (leader ? leader[scoreKey] : -Infinity)) {
                                return athlete;
                            }
                        }
                        return leader;
                    }, null);

                    // Compare with the overall best athlete for this type across all categories
                    if (leaderInCat) {
                        const currentOverallScore = leaderInCat[scoreKey] || 0;
                        if (type === 'tempo') {
                            if (currentOverallScore < bestScore) {
                                bestScore = currentOverallScore;
                                bestAthlete = leaderInCat;
                            }
                        } else {
                            if (currentOverallScore > bestScore) {
                                bestScore = currentOverallScore;
                                bestAthlete = leaderInCat;
                            }
                        }
                    }
                }
                leadersData[type] = bestAthlete;
            }

            // Populate the HTML
            for (const type of types) {
                const leader = leadersData[type];
                const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
                
                if (leader) {
                    const { name: athleteName, team } = parseNameAndTeam(leader.name);
                    document.getElementById(`leader-${type}-jersey`).innerHTML = jerseyIcons[type];
                    document.getElementById(`leader-${type}-name`).innerText = athleteName;
                    document.getElementById(`leader-${type}-team`).innerText = team;
                } else {
                    document.getElementById(`leader-${type}-name`).innerText = 'N/A';
                    document.getElementById(`leader-${type}-team`).innerText = '';
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

    initRankingListeners();
    loadRanking('A', 'punti', 'cumulative'); 
    renderLeadersSection(); // Call the new function to populate the leaders section
});
