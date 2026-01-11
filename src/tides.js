import './style.css'
import Chart from 'chart.js/auto'

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/tides.json');
        const tideData = await response.json();

        // 1. Current Status Calculation
        // For simulation, we'll use the 14:00 entry as "current" or find the closest to "now"
        // In a real app, this would be new Date() vs API data
        const now = new Date("2026-01-11T14:00:00Z");
        const currentData = tideData.data.find(d => new Date(d.time).getTime() === now.getTime()) || tideData.data[14];

        updateLiveStatus(currentData, tideData.data);
        renderTideChart(tideData.data);
        updateOutlookTable(tideData.data);
        updateMonetization(currentData);

    } catch (error) {
        console.error("Error loading tide data:", error);
        document.getElementById('safety-message').innerText = "Error loading live tide data. Please try again later.";
    }
});

function updateLiveStatus(current, allData) {
    const height = current.height;
    const direction = current.type === 'rising' || current.type === 'low' ? 'rising' : 'falling';

    // UI Elements
    const badge = document.getElementById('tide-status-badge');
    const directionEl = document.getElementById('tide-direction');
    const heightEl = document.getElementById('current-height');
    const nextEventEl = document.getElementById('next-event');
    const messageEl = document.getElementById('safety-message');

    directionEl.innerText = direction === 'rising' ? 'RISING ⬆️' : 'FALLING ⬇️';
    heightEl.innerText = `${height}m`;

    // Find Next Event (High or Low)
    const nextIdx = allData.findIndex(d => new Date(d.time) > new Date("2026-01-11T14:00:00Z") && (d.type === 'high' || d.type === 'low'));
    if (nextIdx !== -1) {
        const next = allData[nextIdx];
        const timeStr = new Date(next.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        nextEventEl.innerText = `${next.type.toUpperCase()} at ${timeStr}`;
    }

    // Safety Logic
    let safetyMessage = "";
    let safetyClass = "";

    if (height < 0.8) {
        safetyMessage = "🟢 LOW TIDE: Perfect for exploring the Caves & Rock Pools.";
        safetyClass = "safe";
    } else if (height >= 0.8 && height < 1.5 && direction === 'falling') {
        safetyMessage = "🟡 TIDE FALLING: Caves becoming accessible soon. Use caution.";
        safetyClass = "warning";
    } else if (height >= 0.8 && direction === 'rising') {
        safetyMessage = "🔴 DANGER: Tide is rising. Do not attempt Cave walk. Beach may be cut off.";
        safetyClass = "danger";
    } else {
        safetyMessage = "🔵 HIGH TIDE: Perfect for swimming and kayaking.";
        safetyClass = "info";
    }

    badge.innerText = safetyClass.toUpperCase();
    badge.className = `safety-badge ${safetyClass}`;
    messageEl.innerText = safetyMessage;
}

function renderTideChart(data) {
    const ctx = document.getElementById('tideChart').getContext('2d');

    // Get next 12 hours for the chart
    const chartData = data.slice(10, 23); // Roughly midday to midnight

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => new Date(d.time).toLocaleTimeString([], { hour: '2-digit' })),
            datasets: [{
                label: 'Height (m)',
                data: chartData.map(d => d.height),
                borderColor: '#004e64',
                backgroundColor: 'rgba(0, 78, 100, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                annotation: {
                    /* If we had the annotation plugin, we'd add the red line here */
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3,
                    title: { display: true, text: 'Height (meters)' }
                }
            }
        }
    });

    // Manual line if plugin not used: simplest is to draw on background or just leave as is for now
}

function updateOutlookTable(data) {
    const tbody = document.querySelector('#outlook-table tbody');
    // Group by day - for this mock, we only have one day, let's repeat it for effect
    const days = ['Monday 12 Jan', 'Tuesday 13 Jan', 'Wednesday 14 Jan'];

    let html = '';
    days.forEach((day, i) => {
        const isWeekend = day.includes('Sat') || day.includes('Sun');
        html += `
            <tr class="${isWeekend ? 'weekend' : ''}">
                <td>${day}</td>
                <td>06:45 (2.5m), 19:15 (2.4m)</td>
                <td>00:30 (0.6m), 13:00 (0.5m)</td>
                <td>08:05 / 16:30</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function updateMonetization(current) {
    const adContainer = document.getElementById('ad-container');
    const height = current.height;

    if (height > 1.8) {
        adContainer.innerHTML = `
            <div class="ad-content">
                <h4>🌊 Tide is High! Perfect for Paddling</h4>
                <p>Explore the coastline from the water. Rent a paddleboard or kayak today.</p>
                <a href="#" class="btn btn-secondary">Book Water Activities</a>
            </div>
        `;
    } else {
        adContainer.innerHTML = `
            <div class="ad-content">
                <h4>👟 Heading to the Caves?</h4>
                <p>The rocks can be slippery. We recommend these grip-sole water shoes for safety.</p>
                <a href="#" class="btn btn-secondary">Shop Rock Shoes</a>
            </div>
        `;
    }
}
