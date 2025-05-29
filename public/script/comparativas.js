document.addEventListener("DOMContentLoaded", initComparativas);

function initComparativas() {
  Papa.parse('/public/datos/Incendis_con_coordenades_complet (1).csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      const data = results.data.filter(row => row['DATA INCENDI']);
      procesarDatos(data);
      generarTablaResumen(data);
      graficoIncendiosPorAño(data);
      graficoSuperficiePorAño(data);
      graficoMediaSuperficiePorAño(data);
      graficoProporcionForestal(data);
      graficoIncendiosPorTipus(data);
    }
  });
}

function procesarDatos(data) {
  const columnas = ['HAFORESTAL', 'HANOFOREST'];
  columnas.forEach(col => {
    const valores = data.map(row => row[col]).filter(val => val !== null && val !== undefined);
    const moda = calcularModa(valores);
    data.forEach(row => {
      if (row[col] === null || row[col] === undefined || isNaN(Number(row[col]))) {
        row[col] = moda;
      }
    });
  });

  data.forEach(row => {
    const partes = row['DATA INCENDI'].split('/');
    if (partes.length === 3) {
      const fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
      if (!isNaN(fecha)) {
        row['Fecha'] = fecha;
        row['Año'] = fecha.getFullYear();
      }
    }
  });

  data.forEach(row => {
    row['Superficie_Total_Quemada'] = row['HAFORESTAL'] + row['HANOFOREST'];
    if (row['HAFORESTAL'] > row['HANOFOREST']) {
      row['Tipus'] = 'Forestal';
    } else if (row['HAFORESTAL'] < row['HANOFOREST']) {
      row['Tipus'] = 'No forestal';
    } else {
      row['Tipus'] = 'Mixta';
    }
  });
}

function calcularModa(arr) {
  const frecuencia = {};
  let maxFreq = 0;
  let moda = null;
  arr.forEach(val => {
    frecuencia[val] = (frecuencia[val] || 0) + 1;
    if (frecuencia[val] > maxFreq) {
      maxFreq = frecuencia[val];
      moda = val;
    }
  });
  return moda;
}

function generarTablaResumen(data) {
  const totalIncendios = data.length;
  const anys = [...new Set(data.map(row => row['Año']))].sort((a, b) => a - b);
  const rangoAños = anys[anys.length - 1] - anys[0];
  const totalHaForestal = data.reduce((sum, row) => sum + row['HAFORESTAL'], 0);
  const totalHaNoForestal = data.reduce((sum, row) => sum + row['HANOFOREST'], 0);
  const totalHaQuemada = totalHaForestal + totalHaNoForestal;
  const superficieMedia = totalHaQuemada / totalIncendios;

  const tabla = document.getElementById('tablaResumen');
  tabla.innerHTML = `
    <tr><th>Métrica</th><th>Valor</th></tr>
    <tr><td>Número Total de Incendios</td><td>${totalIncendios}</td></tr>
    <tr><td>Rango de Años Analizado</td><td>${rangoAños}</td></tr>
    <tr><td>Superficie Forestal Quemada Total (ha)</td><td>${totalHaForestal.toFixed(2)}</td></tr>
    <tr><td>Superficie No Forestal Quemada Total (ha)</td><td>${totalHaNoForestal.toFixed(2)}</td></tr>
    <tr><td>Superficie Total Quemada (ha)</td><td>${totalHaQuemada.toFixed(2)}</td></tr>
    <tr><td>Superficie Media Quemada por Incendio (ha)</td><td>${superficieMedia.toFixed(2)}</td></tr>
  `;
}

function graficoIncendiosPorAño(data) {
  const conteoPorAño = {};
  data.forEach(row => {
    conteoPorAño[row['Año']] = (conteoPorAño[row['Año']] || 0) + 1;
  });

  const años = Object.keys(conteoPorAño).sort();
  const conteos = años.map(año => conteoPorAño[año]);

  Plotly.newPlot('grafico1', [{
    x: años,
    y: conteos,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Incendios por Año'
  }], {
    title: 'Número de Incendios por Año',
    xaxis: { title: 'Año' },
    yaxis: { title: 'Número de Incendios' }
  });
}

function graficoSuperficiePorAño(data) {
  const superficiePorAño = {};
  data.forEach(row => {
    const año = row['Año'];
    if (!superficiePorAño[año]) {
      superficiePorAño[año] = { 'Forestal': 0, 'No forestal': 0, 'Mixta': 0 };
    }
    superficiePorAño[año][row['Tipus']] += row['Superficie_Total_Quemada'];
  });

  const años = Object.keys(superficiePorAño).sort();
  const forestal = años.map(año => superficiePorAño[año]['Forestal']);
  const noForestal = años.map(año => superficiePorAño[año]['No forestal']);
  const mixta = años.map(año => superficiePorAño[año]['Mixta']);

  Plotly.newPlot('grafico2', [
    { x: años, y: forestal, name: 'Forestal', type: 'bar' },
    { x: años, y: noForestal, name: 'No forestal', type: 'bar' },
    { x: años, y: mixta, name: 'Mixta', type: 'bar' }
  ], {
    title: 'Superficie Quemada por Tipo de Incendio y Año',
    xaxis: { title: 'Año' },
    yaxis: { title: 'Superficie (ha)' },
    barmode: 'stack'
  });
}

function graficoMediaSuperficiePorAño(data) {
  const agrupado = {};
  data.forEach(row => {
    const año = row['Año'];
    if (!agrupado[año]) agrupado[año] = [];
    agrupado[año].push(row['Superficie_Total_Quemada']);
  });

  const años = Object.keys(agrupado).sort();
  const medias = años.map(año => {
    const valores = agrupado[año];
    const suma = valores.reduce((a, b) => a + b, 0);
    return suma / valores.length;
  });

  Plotly.newPlot('grafico3', [{
    x: años,
    y: medias,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Media de Superficie'
  }], {
    title: 'Media de Superficie Quemada por Incendio y Año',
    xaxis: { title: 'Año' },
    yaxis: { title: 'Media (ha)' }
  });
}

function graficoProporcionForestal(data) {
  const total = data.length;
  const conteo = { 'Forestal': 0, 'No forestal': 0, 'Mixta': 0 };
  data.forEach(row => {
    conteo[row['Tipus']]++;
  });

  Plotly.newPlot('grafico4', [{
    labels: Object.keys(conteo),
    values: Object.values(conteo),
    type: 'pie'
  }], {
    title: 'Distribución de Tipos de Incendio'
  });
}

function graficoIncendiosPorTipus(data) {
  const agrupado = {};
  data.forEach(row => {
    const any = row['Año'];
    const tipus = row['Tipus'];
    if (!agrupado[any]) agrupado[any] = { 'Forestal': 0, 'No forestal': 0, 'Mixta': 0 };
    agrupado[any][tipus]++;
  });

  const años = Object.keys(agrupado).sort();
  const forestal = años.map(a => agrupado[a]['Forestal']);
  const noForestal = años.map(a => agrupado[a]['No forestal']);
  const mixta = años.map(a => agrupado[a]['Mixta']);

  Plotly.newPlot('grafico5', [
    { x: años, y: forestal, name: 'Forestal', type: 'bar' },
    { x: años, y: noForestal, name: 'No forestal', type: 'bar' },
    { x: años, y: mixta, name: 'Mixta', type: 'bar' }
  ], {
    title: 'Número de Incendios por Tipo y Año',
    xaxis: { title: 'Año' },
    yaxis: { title: 'Cantidad' },
    barmode: 'group'
  });
}
