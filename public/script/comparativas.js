function initComparativas() {
 Papa.parse("/public/datos/Incendis_con_coordenades_complet (1).csv", {
    header: true,
    download: true,
    complete: function(results) {
      const data = results.data.filter(row => row['Any']); // Evitar filas vacías

      // Paso 1: Resumen
      const totalIncendios = data.length;
      const años = [...new Set(data.map(d => d.Any))].map(Number);
      const rangoAños = años.length > 1 ? `${Math.min(...años)} - ${Math.max(...años)}` : años[0];

      let totalHaForestal = 0, totalHaNoForestal = 0;
      data.forEach(d => {
        totalHaForestal += parseFloat(d.HAFORESTAL || 0);
        totalHaNoForestal += parseFloat(d.HANOFOREST || 0);
      });

      const totalHaQuemada = totalHaForestal + totalHaNoForestal;
      const superficieMedia = totalIncendios > 0 ? totalHaQuemada / totalIncendios : 0;

      // Mostrar tabla resumen
      document.getElementById("tablaResumen").innerHTML = `
        <tr><th>Mètrica</th><th>Valor</th></tr>
        <tr><td>Nombre Total d'Incendis</td><td>${totalIncendios}</td></tr>
        <tr><td>Rang d'Anys Analitzat</td><td>${rangoAños}</td></tr>
        <tr><td>Superfície Forestal Cremada Total (ha)</td><td>${totalHaForestal.toFixed(2)}</td></tr>
        <tr><td>Superfície No Forestal Cremada Total (ha)</td><td>${totalHaNoForestal.toFixed(2)}</td></tr>
        <tr><td>Superfície Total Cremada (ha)</td><td>${totalHaQuemada.toFixed(2)}</td></tr>
        <tr><td>Superfície Mitjana per Incendi (ha)</td><td>${superficieMedia.toFixed(2)}</td></tr>
      `;

      // Paso 2: Visualizaciones

      // 1. Evolución del número de incendios por año
      const incendiosPorAño = {};
      data.forEach(d => {
        incendiosPorAño[d.Any] = (incendiosPorAño[d.Any] || 0) + 1;
      });
      Plotly.newPlot('grafico1', [{
        x: Object.keys(incendiosPorAño),
        y: Object.values(incendiosPorAño),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Incendis'
      }], {
        title: 'Evolució del Nombre d\'Incendis per Any',
        xaxis: { title: 'Any' },
        yaxis: { title: 'Nombre d\'Incendis' }
      });

      // 2. Superficie quemada por año y tipo
      const superficiePorAño = {};
      data.forEach(d => {
        const any = d.Any;
        superficiePorAño[any] = superficiePorAño[any] || { forestal: 0, noforestal: 0, total: 0 };
        superficiePorAño[any].forestal += parseFloat(d.HAFORESTAL || 0);
        superficiePorAño[any].noforestal += parseFloat(d.HANOFOREST || 0);
        superficiePorAño[any].total += parseFloat(d.HAFORESTAL || 0) + parseFloat(d.HANOFOREST || 0);
      });
      const añosOrdenados = Object.keys(superficiePorAño);
      Plotly.newPlot('grafico2', [
        {
          x: añosOrdenados,
          y: añosOrdenados.map(y => superficiePorAño[y].forestal),
          name: 'Forestal',
          mode: 'lines+markers'
        },
        {
          x: añosOrdenados,
          y: añosOrdenados.map(y => superficiePorAño[y].noforestal),
          name: 'No Forestal',
          mode: 'lines+markers'
        },
        {
          x: añosOrdenados,
          y: añosOrdenados.map(y => superficiePorAño[y].total),
          name: 'Total',
          mode: 'lines+markers'
        }
      ], {
        title: 'Superfície Cremada per Any',
        xaxis: { title: 'Any' },
        yaxis: { title: 'Superfície (ha)' }
      });

      // 3. Top 20 comarcas con más incendios
      const incendiosPorComarca = {};
      data.forEach(d => {
        if (!d.COMARCA) return;
        incendiosPorComarca[d.COMARCA] = (incendiosPorComarca[d.COMARCA] || 0) + 1;
      });
      const topComarcas = Object.entries(incendiosPorComarca)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
      Plotly.newPlot('grafico3', [{
        x: topComarcas.map(e => e[0]),
        y: topComarcas.map(e => e[1]),
        type: 'bar'
      }], {
        title: 'Top 20 Comarques amb Més Incendis',
        xaxis: { title: 'Comarca', tickangle: -45 },
        yaxis: { title: 'Nombre d\'Incendis' }
      });

      // 4. Superficie quemada por año y tipo de incendio (barras apiladas)
      const superficieTipoPorAño = {};
      data.forEach(d => {
        if (!d.Tipus) return;
        const key = d.Any + '|' + d.Tipus;
        superficieTipoPorAño[key] = (superficieTipoPorAño[key] || 0) +
          (parseFloat(d.HAFORESTAL || 0) + parseFloat(d.HANOFOREST || 0));
      });
      const tipos = [...new Set(data.map(d => d.Tipus))];
      const trazas = tipos.map(tipus => ({
        x: años,
        y: años.map(a => superficieTipoPorAño[a + '|' + tipus] || 0),
        name: tipus,
        type: 'bar'
      }));
      Plotly.newPlot('grafico4', trazas, {
        barmode: 'stack',
        title: 'Superfície Cremada per Tipus d\'Incendi i Any',
        xaxis: { title: 'Any' },
        yaxis: { title: 'Superfície (ha)' }
      });

      // 5. Pie chart de incendios por tipo
      const incendiosPorTipo = {};
      data.forEach(d => {
        if (!d.Tipus) return;
        incendiosPorTipo[d.Tipus] = (incendiosPorTipo[d.Tipus] || 0) + 1;
      });
      Plotly.newPlot('grafico5', [{
        type: 'pie',
        labels: Object.keys(incendiosPorTipo),
        values: Object.values(incendiosPorTipo),
        textinfo: 'label+percent'
      }], {
        title: 'Distribució Percentual per Tipus d\'Incendi'
      });
    }
  });
}

// Hacer disponible globalmente
window.initComparativas = initComparativas;
