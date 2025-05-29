const escalaColores = {
  'Muy alta': 'red',
  'Alta': 'orange',
  'Media': 'yellow',
  'Baja': 'green'
};

let todosDatos = [];

function inicializarMapa() {
  const mapa = L.map('map_inc').setView([41.8, 1.6], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

  Papa.parse("/public/datos/Incendis_con_coordenades_complet (1).csv", {
    header: true,
    download: true,
    complete: function (resultados) {
      todosDatos = resultados.data.filter(d => d.LATITUD && d.LONGITUD);
      todosDatos.forEach(fila => {
        const haForestal = parseFloat(fila.HAFORESTAL) || 0;
        const haNoForestal = parseFloat(fila.HANOFOREST) || 0;
        fila.Tipo = haForestal > haNoForestal ? 'Forestal' : haForestal < haNoForestal ? 'No forestal' : 'Mixta';
      });

      const resumen = {};
      let total = 0;
      todosDatos.forEach(fila => {
        const tipo = fila.Tipo;
        total++;
        const haForestal = parseFloat(fila.HAFORESTAL) || 0;
        const haNoForestal = parseFloat(fila.HANOFOREST) || 0;
        if (!resumen[tipo]) resumen[tipo] = { sup: 0, contador: 0 };
        resumen[tipo].sup += haForestal + haNoForestal;
        resumen[tipo].contador += 1;
      });

      const valores = [];
      for (let tipo in resumen) {
        const r = resumen[tipo];
        const porcentaje = (r.contador / total) * 100;
        resumen[tipo].valor = r.sup + porcentaje;
        valores.push(resumen[tipo].valor);
      }

      valores.sort((a, b) => a - b);
      const [q1, q2, q3] = [
        valores[Math.floor(valores.length * 0.25)],
        valores[Math.floor(valores.length * 0.5)],
        valores[Math.floor(valores.length * 0.75)],
      ];

      for (let tipo in resumen) {
        const v = resumen[tipo].valor;
        resumen[tipo].nivel = v <= q1 ? 'Baja' : v <= q2 ? 'Media' : v <= q3 ? 'Alta' : 'Muy alta';
      }

      crearDesplegables(todosDatos);
      mostrarMarcadores(todosDatos, mapa, resumen);
    }
  });
}

function crearDesplegables(datos) {
  const conjuntoComarcas = new Set(datos.map(d => d.COMARCA).filter(Boolean));
  const conjuntoTipos = new Set(datos.map(d => d.Tipo).filter(Boolean));

  const filtros = document.getElementById("filtros");
  filtros.innerHTML = `
    <label for="comarca">Comarca:</label>
    <select id="comarca">
      <option value="">Todas</option>
      ${[...conjuntoComarcas].map(c => `<option value="${c}">${c}</option>`).join('')}
    </select>

    <label for="tipo">Tipo:</label>
    <select id="tipo">
      <option value="">Todos</option>
      ${[...conjuntoTipos].map(t => `<option value="${t}">${t}</option>`).join('')}
    </select>

    <button id="filtrar">Filtrar</button>
  `;

  document.getElementById("filtrar").addEventListener("click", () => {
    const comarca = document.getElementById("comarca").value;
    const tipo = document.getElementById("tipo").value;
    const mapa = window.referenciaMapa;
    mapa.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) {
        mapa.removeLayer(layer);
      }
    });
    const resumen = construirResumen(todosDatos);
    const filtrados = todosDatos.filter(fila =>
      (!comarca || fila.COMARCA === comarca) &&
      (!tipo || fila.Tipo === tipo)
    );
    mostrarMarcadores(filtrados, mapa, resumen);
  });
}

function construirResumen(datos) {
  const resumen = {};
  let total = 0;
  datos.forEach(fila => {
    const tipo = fila.Tipo;
    total++;
    const haForestal = parseFloat(fila.HAFORESTAL) || 0;
    const haNoForestal = parseFloat(fila.HANOFOREST) || 0;
    if (!resumen[tipo]) resumen[tipo] = { sup: 0, contador: 0 };
    resumen[tipo].sup += haForestal + haNoForestal;
    resumen[tipo].contador += 1;
  });

  const valores = [];
  for (let tipo in resumen) {
    const r = resumen[tipo];
    const porcentaje = (r.contador / total) * 100;
    resumen[tipo].valor = r.sup + porcentaje;
    valores.push(resumen[tipo].valor);
  }

  valores.sort((a, b) => a - b);
  const [q1, q2, q3] = [
    valores[Math.floor(valores.length * 0.25)],
    valores[Math.floor(valores.length * 0.5)],
    valores[Math.floor(valores.length * 0.75)],
  ];

  for (let tipo in resumen) {
    const v = resumen[tipo].valor;
    resumen[tipo].nivel = v <= q1 ? 'Baja' : v <= q2 ? 'Media' : v <= q3 ? 'Alta' : 'Muy alta';
  }

  return resumen;
}

function mostrarMarcadores(datos, mapa, resumen) {
  datos.forEach(fila => {
    const lat = parseFloat(fila.LATITUD);
    const lon = parseFloat(fila.LONGITUD);
    const tipo = fila.Tipo;
    const prioridad = resumen[tipo].nivel;
    const color = escalaColores[prioridad] || 'gray';

    L.circleMarker([lat, lon], {
      radius: 6,
      color: color,
      fillOpacity: 0.8
    }).bindPopup(`
      <strong>${fila.TERMEMUNIC}</strong> - ${fila["DATA INCENDI"]}<br>
      Tipo: ${tipo}<br>
      Prioridad: ${prioridad}
    `).addTo(mapa);
  });

  if (!mapa.leyendaAgregada) {
    const leyenda = L.control({ position: 'bottomleft' });
    leyenda.onAdd = function () {
      const div = L.DomUtil.create('div', 'leyenda');
      div.innerHTML = "<strong>Prioridad</strong><br>";
      for (const clave in escalaColores) {
        div.innerHTML += `<i style="background:${escalaColores[clave]}"></i> ${clave}<br>`;
      }
      return div;
    };
    leyenda.addTo(mapa);
    mapa.leyendaAgregada = true;
  }

  window.referenciaMapa = mapa;
}

window.inicializarMapa = inicializarMapa;
