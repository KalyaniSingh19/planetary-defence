let OBJECTS = [];
let APPROACHES = [];

Promise.all([
  fetch('data/objects.json').then(r => r.json()),
  fetch('data/approaches.json').then(r => r.json())
]).then(([objects, approaches]) => {
  OBJECTS = objects;
  APPROACHES = approaches;
});

const searchBox = document.getElementById('searchBox');
const resultsBox = document.getElementById('searchResults');

searchBox.addEventListener('input', () => {
  const q = searchBox.value.trim().toLowerCase();
  resultsBox.innerHTML = '';
  if (q.length < 2) return;

  const matches = OBJECTS.filter(o =>
    o.id.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)
  ).slice(0, 15);

  matches.forEach(o => {
    const div = document.createElement('div');
    div.textContent = `${o.name} (${o.orbitclass}${o.pha === 'Yes' ? ', PHA' : ''})`;
    div.onclick = () => showDetail(o.id);
    resultsBox.appendChild(div);
  });
});

function showDetail(id) {
  const obj = OBJECTS.find(o => o.id === id);
  if (!obj) return;

  resultsBox.innerHTML = '';
  searchBox.value = obj.name;
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('detailPanel').style.display = 'block';
  document.getElementById('detailName').textContent = obj.name;

  const phaClass = obj.pha === 'Yes' ? 'yes' : 'no';
  document.getElementById('detailGrid').innerHTML = `
    <div class="detail-item"><div class="k">Orbit Class</div><div class="v">${obj.orbitclass}</div></div>
    <div class="detail-item"><div class="k">Potentially Hazardous</div><div class="v"><span class="pill ${phaClass}">${obj.pha}</span></div></div>
    <div class="detail-item"><div class="k">Diameter</div><div class="v">${obj.diameter_km != null ? obj.diameter_km + ' km' : 'Unknown'}</div></div>
    <div class="detail-item"><div class="k">Condition Code</div><div class="v">${obj.condition_code ?? '—'}</div></div>
    <div class="detail-item"><div class="k">Absolute Magnitude (H)</div><div class="v">${obj.H ?? '—'}</div></div>
    <div class="detail-item"><div class="k">MOID</div><div class="v">${obj.moid_ld != null ? obj.moid_ld + ' LD' : '—'}</div></div>
    <div class="detail-item"><div class="k">Observations Used</div><div class="v">${obj.n_obs_used ?? '—'}</div></div>
    <div class="detail-item"><div class="k">Observation Arc</div><div class="v">${obj.data_arc_days != null ? obj.data_arc_days + ' days' : '—'}</div></div>
    <div class="detail-item"><div class="k">Orbital Period</div><div class="v">${obj.per_y != null ? obj.per_y + ' yrs' : '—'}</div></div>
  `;

  const history = APPROACHES.filter(a => a.id === id).sort((a,b) => new Date(a.date) - new Date(b.date));

  if (history.length === 0) {
    document.getElementById('historyChart').innerHTML = '<p class="muted">No recorded close approaches for this object in the dataset.</p>';
    return;
  }

  Plotly.newPlot('historyChart', [{
    x: history.map(h => h.date),
    y: history.map(h => h.distance_ld),
    mode: 'lines+markers',
    marker: { size: 8, color: '#5b8cff' },
    line: { color: '#5b8cff' },
    text: history.map(h => `Velocity: ${h.velocity_kms} km/s`),
    hovertemplate: '%{x}<br>Distance: %{y} LD<br>%{text}<extra></extra>'
  }], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    xaxis: { title: 'Date', gridcolor: '#24304a' },
    yaxis: { title: 'Distance (Lunar Distances)', gridcolor: '#24304a' },
    margin: { t: 10 }
  }, {responsive: true});
}
