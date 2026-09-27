let APPROACHES = [];
let OBJ_BY_ID = {};

Promise.all([
  fetch('data/approaches.json').then(r => r.json()),
  fetch('data/objects.json').then(r => r.json())
]).then(([approaches, objects]) => {
  objects.forEach(o => OBJ_BY_ID[o.id] = o);
  APPROACHES = approaches
    .filter(a => a.distance_ld != null && a.velocity_kms != null && a.distance_ld <= 5)
    .map(a => {
      const obj = OBJ_BY_ID[a.id] || {};
      return {
        ...a,
        name: obj.name || a.id,
        pha: obj.pha || 'Unknown',
        diameter_km: obj.diameter_km
      };
    });

  document.getElementById('ldSlider').addEventListener('input', render);
  render();
});

function render() {
  const threshold = parseFloat(document.getElementById('ldSlider').value);
  document.getElementById('ldValue').textContent = threshold.toFixed(1) + ' LD';

  const within = APPROACHES.filter(a => a.distance_ld <= threshold);
  renderKPIs(within, threshold);
  renderScatter();
}

function renderKPIs(within, threshold) {
  document.getElementById('kpis').innerHTML = `
    <div class="kpi-card"><div class="label">Approaches Within ${threshold.toFixed(1)} LD</div><div class="value">${within.length.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="label">Unique Objects</div><div class="value">${new Set(within.map(a=>a.id)).size.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="label">Total Plotted (≤5 LD)</div><div class="value">${APPROACHES.length.toLocaleString()}</div></div>
  `;
}

function renderScatter() {
  const yes = APPROACHES.filter(a => a.pha === 'Y' || a.pha === 'Yes');
  const no = APPROACHES.filter(a => !(a.pha === 'Y' || a.pha === 'Yes'));

  function trace(pts, name, color) {
    return {
      x: pts.map(a => a.distance_ld),
      y: pts.map(a => a.velocity_kms),
      text: pts.map(a => `${a.name}<br>${a.date}`),
      mode: 'markers',
      name,
      marker: {
        size: pts.map(a => a.diameter_km ? Math.max(6, Math.min(40, a.diameter_km * 3)) : 8),
        color, opacity: 0.7
      }
    };
  }

  Plotly.newPlot('scatterChart', [trace(no, 'Non-PHA', '#5b8cff'), trace(yes, 'PHA', '#ff6b6b')], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    legend: { orientation: 'h', y: -0.15 },
    xaxis: { title: 'Distance (Lunar Distances)', gridcolor: '#24304a' },
    yaxis: { title: 'Velocity (km/s)', gridcolor: '#24304a' },
    margin: { t: 10 }
  }, {responsive: true});
}
