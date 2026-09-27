let OBJECTS = [];
let AVG_UNCERTAINTY_LD = null;
const LD_PER_AU = 389.174;

Promise.all([
  fetch('data/objects.json').then(r => r.json()),
  fetch('data/approaches.json').then(r => r.json())
]).then(([objects, approaches]) => {
  OBJECTS = objects;

  // Average distance uncertainty (LD) from approach min/max distance
  const diffs = approaches
    .filter(a => a.dist_min_au != null && a.dist_max_au != null)
    .map(a => (a.dist_max_au - a.dist_min_au) * LD_PER_AU);
  AVG_UNCERTAINTY_LD = diffs.reduce((a,b) => a+b, 0) / diffs.length;

  render();

  document.getElementById('ccSlider').addEventListener('input', render);
  document.getElementById('colorBy').addEventListener('change', renderScatter);
});

function render() {
  const maxCC = parseInt(document.getElementById('ccSlider').value);
  document.getElementById('ccValue').textContent = maxCC === 9 ? '9 (all objects)' : maxCC;

  const filtered = OBJECTS.filter(o => o.condition_code == null || o.condition_code <= maxCC);
  renderKPIs(filtered);
  renderConditionChart(filtered);
  renderCoverageChart(filtered);
  renderScatter();
}

function renderKPIs(filtered) {
  const withDiameter = filtered.filter(o => o.diameter_km != null).length;
  const coveragePct = (withDiameter / filtered.length * 100).toFixed(1);
  const wellObserved = filtered.filter(o => o.condition_code != null && o.condition_code <= 2).length;

  document.getElementById('kpis').innerHTML = `
    <div class="kpi-card"><div class="label">Objects in View</div><div class="value">${filtered.length.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="label">Diameter Coverage</div><div class="value">${coveragePct}%</div></div>
    <div class="kpi-card"><div class="label">Well-Observed (CC ≤ 2)</div><div class="value">${wellObserved.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="label">Avg. Distance Uncertainty</div><div class="value">${AVG_UNCERTAINTY_LD.toFixed(3)} LD</div></div>
  `;
}

function renderConditionChart(filtered) {
  const counts = {};
  filtered.forEach(o => {
    const cc = o.condition_code == null ? 'Unknown' : o.condition_code;
    counts[cc] = (counts[cc] || 0) + 1;
  });
  const keys = Object.keys(counts).sort();
  Plotly.newPlot('ccChart', [{
    x: keys, y: keys.map(k => counts[k]), type: 'bar', marker: { color: '#5b8cff' }
  }], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    xaxis: { title: 'Condition Code', gridcolor: '#24304a' },
    yaxis: { title: 'Object Count', gridcolor: '#24304a' },
    margin: { t: 10 }
  }, {responsive: true});
}

function renderCoverageChart(filtered) {
  const classes = [...new Set(filtered.map(o => o.orbitclass))];
  const pct = classes.map(c => {
    const inClass = filtered.filter(o => o.orbitclass === c);
    const withD = inClass.filter(o => o.diameter_km != null).length;
    return (withD / inClass.length * 100);
  });
  Plotly.newPlot('coverageChart', [{
    x: classes, y: pct, type: 'bar', marker: { color: '#ff6b6b' }
  }], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    xaxis: { title: 'Orbit Class', gridcolor: '#24304a' },
    yaxis: { title: 'Diameter Coverage %', gridcolor: '#24304a' },
    margin: { t: 10 }
  }, {responsive: true});
}

function renderScatter() {
  const maxCC = parseInt(document.getElementById('ccSlider').value);
  const colorBy = document.getElementById('colorBy').value;
  const filtered = OBJECTS.filter(o =>
    (o.condition_code == null || o.condition_code <= maxCC) &&
    o.n_obs_used != null && o.data_arc_days != null
  );

  const groups = [...new Set(filtered.map(o => o[colorBy]))];
  const palette = ['#5b8cff','#ff6b6b','#7ee6a3','#ffd166','#c792ea','#4ecdc4','#f78fb3','#a0c4ff','#ffb4a2','#b8f2e6'];

  const traces = groups.map((g, i) => {
    const pts = filtered.filter(o => o[colorBy] === g);
    return {
      x: pts.map(o => o.data_arc_days),
      y: pts.map(o => o.n_obs_used),
      text: pts.map(o => o.name),
      mode: 'markers',
      type: 'scattergl',
      name: String(g),
      marker: { size: 4, opacity: 0.6, color: palette[i % palette.length] }
    };
  });

  Plotly.newPlot('scatterChart', traces, {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    legend: { orientation: 'h', y: -0.2 },
    xaxis: { title: 'Observation Arc (days)', type: 'log', gridcolor: '#24304a' },
    yaxis: { title: 'Observations Used', type: 'log', gridcolor: '#24304a' },
    margin: { t: 10 }
  }, {responsive: true});
}
