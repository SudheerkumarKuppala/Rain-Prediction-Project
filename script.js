// SafeRouteX AI - Main JavaScript

// ---- Navbar scroll effect ----
window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// ---- Animated particles in hero ----
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 4 + 2;
        p.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 15 + 10}s;
            animation-delay: ${Math.random() * 10}s;
            opacity: ${Math.random() * 0.5 + 0.1};
        `;
        container.appendChild(p);
    }
}
createParticles();

// ---- Counter animation for hero stats ----
function animateCounter(el, target, duration = 2000, decimals = 0) {
    const start = performance.now();
    const update = (time) => {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = eased * target;
        el.textContent = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString();
    };
    requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.dataset.target);
            const decimals = String(el.dataset.target).includes('.') ? 2 : 0;
            animateCounter(el, target, 1800, decimals);
            statsObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num').forEach(el => statsObserver.observe(el));

// ---- Metric bar animation ----
const metricsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const fill = card.querySelector('.metric-bar-fill');
            const valueEl = card.querySelector('.metric-value');
            if (fill) {
                const w = parseFloat(fill.dataset.width);
                setTimeout(() => { fill.style.width = w + '%'; }, 200);
            }
            if (valueEl) {
                const v = parseFloat(valueEl.dataset.value);
                const decimals = String(valueEl.dataset.value).includes('.') ? 2 : 0;
                animateCounter(valueEl, v, 1500, decimals);
                setTimeout(() => {
                    valueEl.textContent = (decimals > 0 ? v.toFixed(decimals) : v) + '%';
                }, 1600);
            }
            metricsObserver.unobserve(card);
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.metric-card').forEach(el => metricsObserver.observe(el));

// ---- Prediction Form Submit ----
document.getElementById('predictionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('predictBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnSpinner = btn.querySelector('.btn-spinner');

    btn.disabled = true;
    btnText.classList.add('d-none');
    btnSpinner.classList.remove('d-none');

    const formData = {
        Start_Lat: document.getElementById('Start_Lat').value,
        Start_Lng: document.getElementById('Start_Lng').value,
        End_Lat: document.getElementById('End_Lat').value || '0',
        End_Lng: document.getElementById('End_Lng').value || '0',
        Distance_mi: document.getElementById('Distance_mi').value,
        Temperature_F: document.getElementById('Temperature_F').value,
        Wind_Chill_F: document.getElementById('Wind_Chill_F').value,
        Humidity_pct: document.getElementById('Humidity_pct').value,
        Pressure_in: document.getElementById('Pressure_in').value,
        Visibility_mi: document.getElementById('Visibility_mi').value,
        Wind_Speed_mph: document.getElementById('Wind_Speed_mph').value,
        Precipitation_in: document.getElementById('Precipitation_in').value,
        Year: document.getElementById('Year').value,
        Month: document.getElementById('Month').value,
        Day: document.getElementById('Day').value,
        Hour: document.getElementById('Hour').value,
        Weekday: document.getElementById('Weekday').value,
        State: document.getElementById('State').value,
        City: document.getElementById('City').value,
        County: document.getElementById('County').value,
        Timezone: document.getElementById('Timezone').value,
        Wind_Direction: document.getElementById('Wind_Direction').value,
        Weather_Condition: document.getElementById('Weather_Condition').value,
        Source: 'Source2'
    };

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.error) {
            showError(data.error);
        } else {
            showResult(data);
            updateHistory();
        }
    } catch (err) {
        showError('Network error. Please try again.');
    } finally {
        btn.disabled = false;
        btnText.classList.remove('d-none');
        btnSpinner.classList.add('d-none');
    }
});

function showResult(data) {
    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');

    placeholder.classList.add('d-none');
    content.classList.remove('d-none');

    document.getElementById('resultIcon').textContent = data.icon;
    document.getElementById('resultTitle').textContent = data.label;
    document.getElementById('resultSeverity').textContent = `Severity Level ${data.severity} / 4`;
    document.getElementById('resultMessage').innerHTML = `<strong>${data.message}</strong>`;
    document.getElementById('resultRecommendation').innerHTML = `<i class="fa-solid fa-circle-check me-2" style="color:#22c55e"></i>${data.recommendation}`;
    document.getElementById('resultTimestamp').textContent = `Predicted at: ${data.timestamp}`;

    const fill = document.getElementById('riskMeterFill');
    fill.style.background = getSeverityGradient(data.severity);
    fill.style.width = '0%';
    setTimeout(() => { fill.style.width = data.meter + '%'; }, 100);

    // Scroll to result on mobile
    if (window.innerWidth < 992) {
        setTimeout(() => {
            document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

function getSeverityGradient(severity) {
    const gradients = {
        1: 'linear-gradient(90deg, #22c55e, #4ade80)',
        2: 'linear-gradient(90deg, #eab308, #fbbf24)',
        3: 'linear-gradient(90deg, #f97316, #fb923c)',
        4: 'linear-gradient(90deg, #ef4444, #f87171)'
    };
    return gradients[severity] || gradients[2];
}

function showError(msg) {
    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    content.classList.add('d-none');
    placeholder.classList.remove('d-none');
    placeholder.querySelector('h5').textContent = 'Prediction Error';
    placeholder.querySelector('p').textContent = msg;
    placeholder.style.color = '#ef4444';
}

function resetForm() {
    document.getElementById('predictionForm').reset();
    document.getElementById('resultContent').classList.add('d-none');
    document.getElementById('resultPlaceholder').classList.remove('d-none');
    document.getElementById('resultPlaceholder').querySelector('h5').textContent = 'Ready to Predict';
    document.getElementById('resultPlaceholder').querySelector('p').textContent = 'Fill in the form and click "Predict Severity" to get an AI-powered road safety assessment.';
    document.getElementById('resultPlaceholder').style.color = '';
}

// ---- Update history table ----
async function updateHistory() {
    try {
        const response = await fetch('/history');
        const history = await response.json();
        const tbody = document.getElementById('historyTableBody');

        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No predictions yet.</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(h => `
            <tr>
                <td>${h.timestamp}</td>
                <td>${h.location}</td>
                <td><strong style="color: ${getSeverityColor(h.severity)}">${h.icon} Severity ${h.severity}</strong></td>
                <td><span class="badge" style="background:${getSeverityColor(h.severity)}22; color:${getSeverityColor(h.severity)}; border:1px solid ${getSeverityColor(h.severity)}44; border-radius:6px; padding:4px 10px">${h.label}</span></td>
            </tr>
        `).join('');
    } catch (e) { /* silent */ }
}

function getSeverityColor(severity) {
    const colors = { 1: '#22c55e', 2: '#eab308', 3: '#f97316', 4: '#ef4444' };
    return colors[severity] || '#94a3b8';
}

// ---- Download PDF Report ----
function downloadReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const severity   = document.getElementById('resultSeverity').textContent.trim();
    const label      = document.getElementById('resultTitle').textContent.trim();
    const message    = document.getElementById('resultMessage').textContent.trim();
    const recommend  = document.getElementById('resultRecommendation').textContent.trim();
    const timestamp  = document.getElementById('resultTimestamp').textContent.replace('Predicted at: ', '').trim();

    const lat        = document.getElementById('Start_Lat').value;
    const lng        = document.getElementById('Start_Lng').value;
    const temp       = document.getElementById('Temperature_F').value;
    const humidity   = document.getElementById('Humidity_pct').value;
    const visibility = document.getElementById('Visibility_mi').value;
    const wind       = document.getElementById('Wind_Speed_mph').value;
    const pressure   = document.getElementById('Pressure_in').value;
    const state      = document.getElementById('State').value;
    const year       = document.getElementById('Year').value;
    const month      = document.getElementById('Month').value;
    const day        = document.getElementById('Day').value;
    const hour       = document.getElementById('Hour').value;
    const weather    = document.getElementById('Weather_Condition').value;

    const dateStr    = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const pageW      = doc.internal.pageSize.getWidth();
    const pageH      = doc.internal.pageSize.getHeight();
    const margin     = 50;
    const contentW   = pageW - margin * 2;
    let y            = 0;

    /* ── severity colour mapping ── */
    const sevNum = parseInt(severity.replace(/\D/g,'')) || 1;
    const sevColours = { 1:[34,197,94], 2:[234,179,8], 3:[249,115,22], 4:[239,68,68] };
    const sevCol = sevColours[sevNum] || sevColours[1];

    /* ── helper: text wrap ── */
    function wrapText(text, x, startY, maxW, lineH) {
        const words = text.split(' ');
        let line = '';
        let cy = startY;
        words.forEach((w, i) => {
            const test = line + (line ? ' ' : '') + w;
            if (doc.getTextWidth(test) > maxW && line) {
                doc.text(line, x, cy);
                cy += lineH;
                line = w;
            } else {
                line = test;
            }
            if (i === words.length - 1) { doc.text(line, x, cy); cy += lineH; }
        });
        return cy;
    }

    /* ══════════════════════════════════════════
       HEADER BAND
    ══════════════════════════════════════════ */
    doc.setFillColor(10, 22, 50);
    doc.rect(0, 0, pageW, 110, 'F');

    /* accent strip */
    doc.setFillColor(...sevCol);
    doc.rect(0, 108, pageW, 4, 'F');

    /* logo circle */
    doc.setFillColor(59, 130, 246);
    doc.circle(margin + 28, 55, 22, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('S', margin + 21, 61);

    /* title */
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SafeRouteX AI', margin + 62, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Accident Severity Prediction Report', margin + 62, 65);

    /* timestamp top-right */
    doc.setFontSize(8.5);
    doc.setTextColor(100, 120, 160);
    doc.text(`Generated: ${timestamp}`, pageW - margin, 65, { align: 'right' });

    y = 130;

    /* ══════════════════════════════════════════
       PREDICTION RESULT CARD
    ══════════════════════════════════════════ */
    /* card background */
    doc.setFillColor(14, 26, 54);
    doc.roundedRect(margin, y, contentW, 130, 10, 10, 'F');

    /* left accent bar */
    doc.setFillColor(...sevCol);
    doc.roundedRect(margin, y, 5, 130, 2, 2, 'F');

    /* severity badge */
    doc.setFillColor(...sevCol);
    doc.roundedRect(margin + 18, y + 20, 120, 34, 6, 6, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(severity, margin + 78, y + 42, { align: 'center' });

    /* risk label */
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(label, margin + 155, y + 38);

    /* assessment & recommendation */
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Assessment:', margin + 18, y + 72);
    doc.setTextColor(203, 213, 225);
    wrapText(message, margin + 105, y + 72, contentW - 120, 13);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Recommendation:', margin + 18, y + 95);
    doc.setTextColor(203, 213, 225);
    wrapText(recommend, margin + 125, y + 95, contentW - 140, 13);

    y += 148;

    /* ══════════════════════════════════════════
       TWO-COLUMN SECTION: Input Parameters
    ══════════════════════════════════════════ */
    function sectionHeader(title, yPos) {
        doc.setFillColor(10, 22, 50);
        doc.rect(margin, yPos, contentW, 26, 'F');
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, yPos, 3, 26, 'F');
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin + 12, yPos + 17);
        return yPos + 36;
    }

    function tableRow(label2, value, xLeft, yPos, colW) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 120, 160);
        doc.text(label2, xLeft, yPos);
        doc.setTextColor(203, 213, 225);
        doc.text(String(value), xLeft + colW - 10, yPos, { align: 'right' });
        doc.setDrawColor(30, 50, 90);
        doc.line(xLeft, yPos + 4, xLeft + colW, yPos + 4);
        return yPos + 18;
    }

    y = sectionHeader('INPUT PARAMETERS', y);

    const colW = (contentW - 16) / 2;
    const colR = margin + colW + 16;
    let yL = y, yR = y;

    /* left column */
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Location & Time', margin, yL); yL += 14;
    yL = tableRow('Latitude', lat, margin, yL, colW);
    yL = tableRow('Longitude', lng, margin, yL, colW);
    yL = tableRow('State', state, margin, yL, colW);
    yL = tableRow('Date', dateStr, margin, yL, colW);
    yL = tableRow('Hour', `${String(hour).padStart(2,'0')}:00`, margin, yL, colW);

    /* right column */
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Weather Conditions', colR, yR); yR += 14;
    yR = tableRow('Temperature', `${temp} °F`, colR, yR, colW);
    yR = tableRow('Humidity', `${humidity} %`, colR, yR, colW);
    yR = tableRow('Visibility', `${visibility} mi`, colR, yR, colW);
    yR = tableRow('Wind Speed', `${wind} mph`, colR, yR, colW);
    yR = tableRow('Pressure', `${pressure} in`, colR, yR, colW);
    yR = tableRow('Weather', weather, colR, yR, colW);

    y = Math.max(yL, yR) + 16;

    /* ══════════════════════════════════════════
       MODEL INFORMATION
    ══════════════════════════════════════════ */
    y = sectionHeader('MODEL INFORMATION', y);

    /* 3-metric badges */
    const badges = [
        { label: 'Model Accuracy', value: '87.88%' },
        { label: 'Features Used', value: '24' },
        { label: 'Dataset Records', value: '1.1M+' }
    ];
    const bW = (contentW - 24) / 3;
    badges.forEach((b, i) => {
        const bx = margin + i * (bW + 12);
        doc.setFillColor(14, 26, 54);
        doc.roundedRect(bx, y, bW, 52, 6, 6, 'F');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(b.value, bx + bW / 2, y + 28, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 120, 160);
        doc.text(b.label, bx + bW / 2, y + 43, { align: 'center' });
    });

    y += 68;

    /* algorithm row */
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 120, 160);
    doc.text('Algorithm:', margin, y);
    doc.setTextColor(203, 213, 225);
    doc.text('XGBoost Classifier  (n_estimators=200, max_depth=6, lr=0.1)', margin + 70, y);
    y += 14;
    doc.text('Severity Scale:', margin, y);
    doc.setTextColor(203, 213, 225);
    doc.text('1 = Minor  ·  2 = Moderate  ·  3 = Serious  ·  4 = Fatal', margin + 90, y);
    y += 24;

    /* ══════════════════════════════════════════
       DISCLAIMER
    ══════════════════════════════════════════ */
    doc.setFillColor(22, 35, 60);
    doc.roundedRect(margin, y, contentW, 62, 6, 6, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 179, 8);
    doc.text('Disclaimer', margin + 12, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const disclaimer = 'Predictions are generated using historical accident data and machine learning techniques. Results are for informational purposes only and should not replace official traffic advisories or real-time road safety information.';
    wrapText(disclaimer, margin + 12, y + 30, contentW - 24, 12);

    y += 78;

    /* ══════════════════════════════════════════
       FOOTER BAR
    ══════════════════════════════════════════ */
    doc.setFillColor(10, 22, 50);
    doc.rect(0, pageH - 42, pageW, 42, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(0, pageH - 42, pageW, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 120, 160);
    doc.text('SafeRouteX AI  ·  BVC Engineering College, Odalarevu, Andhra Pradesh', margin, pageH - 18);
    doc.text(`© ${new Date().getFullYear()} All Rights Reserved`, pageW - margin, pageH - 18, { align: 'right' });

    /* ── save ── */
    doc.save(`SafeRouteX_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ---- Leaflet Map with Hotspots ----
function initMap() {
    const map = L.map('accidentMap', {
        center: [37.5, -98.5],
        zoom: 4,
        zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
    }).addTo(map);

    const hotspots = [
        { lat: 34.05, lng: -118.24, level: 'High', name: 'Los Angeles, CA', count: 45230, color: '#ef4444' },
        { lat: 25.77, lng: -80.19, level: 'High', name: 'Miami, FL', count: 38900, color: '#ef4444' },
        { lat: 33.45, lng: -112.07, level: 'High', name: 'Phoenix, AZ', count: 32100, color: '#ef4444' },
        { lat: 36.17, lng: -115.14, level: 'High', name: 'Las Vegas, NV', count: 28400, color: '#ef4444' },
        { lat: 29.76, lng: -95.37, level: 'High', name: 'Houston, TX', count: 41500, color: '#ef4444' },
        { lat: 30.27, lng: -97.74, level: 'Moderate', name: 'Austin, TX', count: 18700, color: '#f97316' },
        { lat: 39.95, lng: -75.17, level: 'Moderate', name: 'Philadelphia, PA', count: 21300, color: '#f97316' },
        { lat: 33.75, lng: -84.39, level: 'Moderate', name: 'Atlanta, GA', count: 26800, color: '#f97316' },
        { lat: 36.17, lng: -86.78, level: 'Moderate', name: 'Nashville, TN', count: 15600, color: '#f97316' },
        { lat: 39.10, lng: -84.51, level: 'Moderate', name: 'Cincinnati, OH', count: 12300, color: '#f97316' },
        { lat: 44.98, lng: -93.27, level: 'Low', name: 'Minneapolis, MN', count: 8900, color: '#22c55e' },
        { lat: 43.05, lng: -76.15, level: 'Low', name: 'Syracuse, NY', count: 5600, color: '#22c55e' },
        { lat: 46.87, lng: -96.79, level: 'Low', name: 'Fargo, ND', count: 3200, color: '#22c55e' },
        { lat: 47.61, lng: -122.33, level: 'Low', name: 'Seattle, WA', count: 9800, color: '#22c55e' },
        { lat: 45.52, lng: -122.68, level: 'Low', name: 'Portland, OR', count: 7400, color: '#22c55e' }
    ];

    hotspots.forEach(h => {
        const radius = h.level === 'High' ? 22 : h.level === 'Moderate' ? 16 : 10;
        L.circleMarker([h.lat, h.lng], {
            radius: radius,
            fillColor: h.color,
            color: h.color,
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.4
        }).addTo(map).bindPopup(`
            <div style="background:#0d2137;color:#f1f5f9;border:1px solid rgba(59,130,246,0.3);border-radius:10px;padding:12px;min-width:160px">
                <strong style="color:#60a5fa">${h.name}</strong><br>
                <span style="color:#94a3b8">Risk Level:</span> <strong style="color:${h.color}">${h.level}</strong><br>
                <span style="color:#94a3b8">Accidents:</span> <strong>${h.count.toLocaleString()}</strong>
            </div>
        `, { className: 'custom-popup' });
    });
}

// Wait for DOM to be ready before initializing map
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    setTimeout(initMap, 300);
}

// ---- Scroll reveal animation ----
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
    const revealItems = document.querySelectorAll(
        '.overview-card, .feature-card, .metric-card, .importance-card, .footer-card, .info-stat-card'
    );
    revealItems.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        revealObserver.observe(el);
    });

    updateHistory();
});
