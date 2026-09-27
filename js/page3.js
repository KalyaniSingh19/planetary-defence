fetch('data/objects.json').then(r => r.json()).then(objects => {
  renderShape(objects);
  renderHeat(objects);
  renderTable(objects);
});

function sizeBand(km) {
  if (km == null) return 'Unknown';
  if (km < 0.05) return '< 50 m';
  if (km < 0.1) return '50-100 m';
  if (km < 0.5) return '100-500 m';
  return '500+ m';
}

function renderShape(objects) {
  const classes = [...new Set(objects.map(o => o.orbitclass))];
  const palette = ['#5b8cff','#ff6b6b','#7ee6a3','#ffd166'];
  const traces = classes.map((c, i) => {
    const pts = objects.filter(o => o.orbitclass === c && o.a != null && o.e != null);
    return {
      x: pts.map(o => o.a), y: pts.map(o => o.e), mode: 'markers', type: 'scattergl',
      name: c, marker: { size: 4, opacity: 0.5, color: palette[i % palette.length] }
    };
  });
  Plotly.newPlot('shapeChart', traces, {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    legend: { orientation: 'h', y: -0.2 },
    xaxis: { title: 'Semi-Major Axis (AU)', gridcolor: '#24304a' },
    yaxis: { title: 'Eccentricity', gridcolor: '#24304a' },
    margin: { t: 10 }
  }, {responsive: true});
}

function renderHeat(objects) {
  const classes = [...new Set(objects.map(o => o.orbitclass))].sort();
  const bands = ['Unknown', '< 50 m', '50-100 m', '100-500 m', '500+ m'];
  const z = classes.map(c => bands.map(b =>
    objects.filter(o => o.orbitclass === c && sizeBand(o.diameter_km) === b).length
  ));
  Plotly.newPlot('heatChart', [{
    z, x: bands, y: classes, type: 'heatmap', colorscale: 'Blues'
  }], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#e8edf7' },
    xaxis: { title: 'Size Band' }, yaxis: { title: 'Orbit Class' },
    margin: { t: 10 }
  }, {responsive: true});
}

function renderTable(objects) {
  const top10 = objects
    .filter(o => o.diameter_km != null)
    .sort((a,b) => b.diameter_km - a.diameter_km)
    .slice(0, 10);

  let html = `<tr style="text-align:left; color:#93a0bd; border-bottom:1px solid #24304a;">
    <th style="padding:8px;">Name</th><th>Orbit Class</th><th>Diameter (km)</th><th>PHA</th></tr>`;
  top10.forEach(o => {
    html += `<tr style="border-bottom:1px solid #24304a;">
      <td style="padding:8px;">${o.name}</td><td>${o.orbitclass}</td>
      <td>${o.diameter_km}</td><td>${o.pha}</td></tr>`;
  });
  document.getElementById('topTable').innerHTML = html;
}
