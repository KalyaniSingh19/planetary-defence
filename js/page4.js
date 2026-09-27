fetch('data/discoveries.json')
  .then(r => r.json())
  .then(data => {
    const surveys = [...new Set(data.map(d => d.survey))];
    const years = [...new Set(data.map(d => d.year))].sort((a,b) => a-b);

    // KPIs
    const totalDiscoveries = data.reduce((s,d) => s + d.count, 0);
    const bySurveyTotal = {};
    surveys.forEach(s => bySurveyTotal[s] = data.filter(d => d.survey === s).reduce((a,d) => a + d.count, 0));
    const topSurvey = Object.entries(bySurveyTotal).sort((a,b) => b[1]-a[1])[0];
    const latestYear = years[years.length - 1];
    const latestYearCount = data.filter(d => d.year === latestYear).reduce((s,d) => s + d.count, 0);

    document.getElementById('kpis').innerHTML = `
      <div class="kpi-card"><div class="label">Total Discoveries</div><div class="value">${totalDiscoveries.toLocaleString()}</div></div>
      <div class="kpi-card"><div class="label">Top Survey</div><div class="value">${topSurvey[0]}</div></div>
      <div class="kpi-card"><div class="label">Surveys Tracked</div><div class="value">${surveys.length}</div></div>
      <div class="kpi-card"><div class="label">${latestYear} Discoveries</div><div class="value">${latestYearCount.toLocaleString()}</div></div>
    `;

    // Grouped bar chart by survey
    const barTraces = surveys.map(s => ({
      x: years,
      y: years.map(y => (data.find(d => d.survey === s && d.year === y) || {count:0}).count),
      name: s,
      type: 'bar'
    }));
    Plotly.newPlot('barChart', barTraces, {
      barmode: 'stack',
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#e8edf7' },
      legend: { orientation: 'h', y: -0.2 },
      xaxis: { title: 'Year', rangeslider: {}, gridcolor: '#24304a' },
      yaxis: { title: 'Discoveries', gridcolor: '#24304a' },
      margin: { t: 10 }
    }, {responsive: true});

    // Cumulative line chart per survey
    const lineTraces = surveys.map(s => {
      let running = 0;
      const y = years.map(yr => {
        running += (data.find(d => d.survey === s && d.year === yr) || {count:0}).count;
        return running;
      });
      return { x: years, y, name: s, mode: 'lines', line: { width: 2 } };
    });
    Plotly.newPlot('lineChart', lineTraces, {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#e8edf7' },
      legend: { orientation: 'h', y: -0.2 },
      xaxis: { title: 'Year', gridcolor: '#24304a' },
      yaxis: { title: 'Cumulative Discoveries', gridcolor: '#24304a' },
      margin: { t: 10 }
    }, {responsive: true});
  });
