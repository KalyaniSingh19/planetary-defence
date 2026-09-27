let APPROACHES = [];
let OBJ_BY_ID = {};

Promise.all([
  fetch('data/approaches.json').then(r => r.json()),
  fetch('data/objects.json').then(r => r.json())
]).then(([approaches, objects]) => {
  objects.forEach(o => OBJ_BY_ID[o.id] = o);
  APPROACHES = approaches.map(a => ({
    ...a,
    year: a.date ? parseInt(a.date.slice(0,4)) : null,
    orbitclass: (OBJ_BY_ID[a.id] || {}).orbitclass || 'Unknown',
    pha: (OBJ_BY_ID[a.id] || {}).pha || 'Unknown'
  }));

  const classes = [...new Set(APPROACHES.map(a => a.orbitclass))].sort();
  const classSel = document.getElementById('classFilter');
  classes.forEach(c => classSel.innerHTML += `<option value="${c}">${c}</option>`);

  const years = [...new Set(APPROACHES.map(a => a.year).filter(y => y))].sort((a,b)=>a-b);
  const yearSel = document.getElementById('yearFilter');
  years.forEach(y => yearSel.innerHTML += `<option value="${y}">${y}+</option>`);

  classSel.addEventListener('change', render);
  yearSel.addEventListener('change', render);
  render();
});

function render() {
  const cls = document.getElementById('classFilter').value;
  const minYear = document.getElementById('yearFilter').value;

  const filtered = APPROACHES.filter(a =>
    (cls === 'all' || a.orbitclass === cls) &&
    (minYear === 'all' || (a.year && a.year >= parseInt(minYear)))
  );

  renderKPIs(filtered);
  renderLine(filtered);
  renderBar(filtered);
  renderDonut(filtered);
}

function renderKPIs(f) {
  const total = f.length;
  const unique = new Set(f.map(a => a.id)).size;
  const dists = f.map(a => a.distance_ld).filter(v => v != null);
  const vels = f.map(a => a.velocity_kms).filter(v => v != null);
  const closest = dists.length ? Math.min(...dists).toFixed(3) : '—';
  const avgVel = vels.length ? (vels.reduce((a,b)=>a+b,0)/vels.length).toFixed(2) : '—';
  const phaCount = f.filter(a => a.pha === 'Y' || a.pha === 'Yes').length;

  document.getElementById('kpis').innerHTML = `
    <div class="kpi-card"><div class="label">Total Approaches</div><div class="value">${total.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="label">Unique Asteroids</div><div class="value">${unique.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="label">Closest Approach</div><div class="value">${closest} LD</div></div>
    <div class="kpi-card"><div class="label">Average Velocity</div><div class="value">${avgVel} km/s</div></div>
    <div class="kpi-card"><div class="label">PHA Approaches</div><div class="value">${phaCount.toLocaleString()}</div></div>
  `;
}

function renderLine(f) {
  const byYear = {};
  f.forEach(a => { if (a.year) byYear[a.year] = (byYear[a.year] || 0) + 1; });
  const years = Object.keys(byYear).sort();
  Plotly.newPlot('lineChart', [{
    x: years, y: years.map(y => byYear[y]), mode: 'lines+markers', line: { color: '#5b8cff' }
  }], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    xaxis: { title: 'Year', gridcolor: '#24304a' }, yaxis: { title: 'Approaches', gridcolor: '#24304a' },
    margin: { t: 10 }
  }, {responsive: true});
}

function renderBar(f) {
  const byClass = {};
  f.forEach(a => { byClass[a.orbitclass] = (byClass[a.orbitclass] || 0) + 1; });
  const classes = Object.keys(byClass);
  Plotly.newPlot('barChart', [{
    y: classes, x: classes.map(c => byClass[c]), type: 'bar', orientation: 'h', marker: { color: '#ff6b6b' }
  }], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    xaxis: { title: 'Approaches', gridcolor: '#24304a' }, yaxis: { title: '', gridcolor: '#24304a' },
    margin: { t: 10, l: 80 }
  }, {responsive: true});
}

function renderDonut(f) {
  const yes = f.filter(a => a.pha === 'Y' || a.pha === 'Yes').length;
  const no = f.length - yes;
  Plotly.newPlot('donutChart', [{
    labels: ['PHA', 'Non-PHA'], values: [yes, no], type: 'pie', hole: 0.5,
    marker: { colors: ['#ff6b6b', '#5b8cff'] }
  }], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    margin: { t: 10 }
  }, {responsive: true});
}
