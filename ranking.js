// ranking.js

document.addEventListener('DOMContentLoaded', () => {
    const cumulativeResultsUrl = 'cumulative_results.json';
    const gara1ResultsUrl = 'gara_1_results.json';
    const gara2ResultsUrl = 'gara_2_results.json'; // Assuming a gara_2_results.json might exist or be simulated

    const podiumContainer = document.getElementById('podium-container');
    const detailedRankingContainer = document.getElementById('detailed-ranking-container');
    const mainTitle = document.getElementById('main-title');
    const garaSelector = document.getElementById('gara-selector');

    let cumulativeData = {};
    let gara1Data = [];
    let gara2Data = {}; // Placeholder for now

    // Helper function to fetch JSON data
    async function fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} from ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    // Function to initialize data
    async function initData() {
        // Fetch gara_2_results.json as well
        [cumulativeData, gara1Data, gara2Data] = await Promise.all([
            fetchJson(cumulativeResultsUrl),
            fetchJson(gara1ResultsUrl),
            fetchJson(gara2ResultsUrl) // Fetch Gara 2 data
        ]);
        
        // Normalize gara2Data if it has the same structure as gara1Data
        if (gara2Data && Array.isArray(gara2Data)) {
            gara2Data = normalizeGara1Data(gara2Data); // Use the same normalization
        } else if (gara2Data === null) {
            console.warn("gara_2_results.json not found or failed to load.");
            // If gara2Data is not found, we can optionally load the existing hardcoded data from the HTML
            // For now, it will remain empty if the file is not there, and display will handle it.
        }
        
        displayRanking('cumulative'); // Default view
    }

    // Function to render podium (top 3 for each category)
    function renderPodium(data, titlePrefix) {
        let podiumHtml = '';
        // Ensure data is not null or empty before processing
        if (!data || Object.keys(data).length === 0) {
            podiumContainer.innerHTML = `<p class="text-center text-red-400">Nessun dato disponibile per il podio di ${titlePrefix}.</p>`;
            return;
        }
        const categories = Object.keys(data).sort(); // Sort categories for consistent display

        for (const category of categories) {
            const riders = data[category];
            // Sort by total points in descending order for podium
            riders.sort((a, b) => b.total - a.total);
            const topRiders = riders.slice(0, 3);

            if (topRiders.length > 0) {
                podiumHtml += `
                    <div class="flex-1 min-w-[250px] bg-zwift-card p-4 rounded-lg shadow-xl border border-gray-800">
                        <h4 class="text-xl text-zwift-blue mt-0 border-b border-gray-700 pb-2 mb-3">Categoria ${category}</h4>
                        <ol class="list-decimal pl-5 space-y-2 text-sm text-zwift-text">
                `;
                topRiders.forEach(rider => {
                    podiumHtml += `<li class="font-bold">${rider.name} (${rider.total} Punti)</li>`;
                });
                podiumHtml += `
                        </ol>
                    </div>
                `;
            }
        }
        podiumContainer.innerHTML = `
            <h2 class="text-2xl font-semibold border-l-4 border-race-flat pl-3 mt-8 mb-4">
                🏆 Podio ${titlePrefix} (Punti)
            </h2>
            <div class="flex flex-wrap justify-center gap-4 mb-8">
                ${podiumHtml}
            </div>
        `;
    }

    // Function to render detailed ranking table
    function renderDetailedRanking(data, titlePrefix) {
        let tableHtml = '';
        // Ensure data is not null or empty before processing
        if (!data || Object.keys(data).length === 0) {
            detailedRankingContainer.innerHTML = `<p class="text-center text-red-400">Nessun dato disponibile per la classifica dettagliata di ${titlePrefix}.</p>`;
            return;
        }

        const categories = Object.keys(data).sort();

        for (const category of categories) {
            const riders = data[category];
            riders.sort((a, b) => b.total - a.total); // Sort by total points

            tableHtml += `
                <div class="mt-12 pt-6 border-t border-gray-800">
                    <h3 class="text-2xl font-bold text-center bg-zwift-card p-3 rounded-lg text-race-flat">CLASSIFICHE DETTAGLIATE - CATEGORIA ${category}</h3>
                </div>
                <h4 class="text-xl text-gray-400 mt-6 mb-3">Classifica ${titlePrefix} (Punti)</h4>
                <div class="table-responsive mb-12">
                    <table class="w-full text-sm border-collapse border border-gray-700 min-w-[600px]">
                        <thead class="bg-zwift-orange text-black font-semibold">
                            <tr>
                                <th class="p-3 border border-gray-700">Pos</th>
                                <th class="p-3 border border-gray-700 text-left">Rider</th>
                                <th class="p-3 border border-gray-700">FAL</th>
                                <th class="p-3 border border-gray-700">FTS</th>
                                <th class="p-3 border border-gray-700">FIN</th>
                                <th class="p-3 border border-gray-700 bg-orange-600">Totale Punti</th>
                                <th class="p-3 border border-gray-700">Tempo</th>
                            </tr>
                        </thead>
                        <tbody class="text-white">
            `;
            riders.forEach((rider, index) => {
                const rowClass = index % 2 === 0 ? 'bg-zwift-card/50' : 'bg-zwift-card';
                tableHtml += `
                    <tr class="${rowClass}">
                        <td class="p-2 border border-gray-700 font-bold">${index + 1}</td>
                        <td class="p-2 border border-gray-700 text-left">${rider.name}</td>
                        <td class="p-2 border border-gray-700">${rider.fal}</td>
                        <td class="p-2 border border-gray-700">${rider.fts}</td>
                        <td class="p-2 border border-gray-700">${rider.fin}</td>
                        <td class="p-2 border border-gray-700 font-bold text-race-flat">${rider.total}</td>
                        <td class="p-2 border border-gray-700">${rider.time ? new Date(rider.time * 1000).toISOString().substr(11, 8) : 'N/A'}</td>
                    </tr>
                `;
            });
            tableHtml += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        detailedRankingContainer.innerHTML = tableHtml;
    }

    // Function to normalize gara1Data (and potentially gara2Data) to match cumulativeData structure for rendering
    // This assumes gara1RawData is an array of rider objects each with a 'category' field
    function normalizeGara1Data(garaRawData) {
        const normalized = {};
        garaRawData.forEach(rider => {
            if (!normalized[rider.category]) {
                normalized[rider.category] = [];
            }
            // Map gara fields to cumulative fields for consistent rendering
            normalized[rider.category].push({
                name: rider.name,
                fal: rider.punti_fal,
                fts: rider.punti_fts,
                fin: rider.punti_fin,
                total: rider.punti_total,
                time: rider.punti_time, // Assuming punti_time is in seconds
                zwid: rider.zwid
            });
        });
        return normalized;
    }

    // Main display function
    function displayRanking(type) {
        let dataToDisplay = {};
        let title = '';

        if (type === 'cumulative' && cumulativeData) {
            dataToDisplay = cumulativeData;
            title = 'CLASSIFICA GENERALE';
        } else if (type === 'gara1' && gara1Data) {
            dataToDisplay = normalizeGara1Data(gara1Data);
            title = 'RISULTATI UFFICIALI - GARA 1';
        } else if (type === 'gara2' && gara2Data) {
            dataToDisplay = gara2Data; // gara2Data is already normalized if it was an array
            title = 'RISULTATI UFFICIALI - GARA 2';
        } else {
            console.error('No data available for selected type:', type);
            // Clear content if no data
            mainTitle.textContent = 'Caricamento Classifiche...';
            podiumContainer.innerHTML = '';
            detailedRankingContainer.innerHTML = '';
            return;
        }

        mainTitle.textContent = title;
        renderPodium(dataToDisplay, title);
        renderDetailedRanking(dataToDisplay, title);
    }

    // Event listener for the gara selector (will be a <select> element in HTML)
    if (garaSelector) {
        garaSelector.addEventListener('change', (event) => {
            displayRanking(event.target.value);
        });
    }

    initData();
});