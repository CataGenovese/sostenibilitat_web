function initSuperficiePorAny() {
  Papa.parse("/public/datos/Incendis_con_coordenades_complet (1).csv", {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;

      // Agrupar datos por año
      const datosAgrupados = {};

      data.forEach(row => {
        const fecha = new Date(row["DATA INCENDI"]);
        const any = fecha.getFullYear();
        const haForestal = parseFloat(row["HAFORESTAL"]) || 0;
        const haNoForestal = parseFloat(row["HANOFOREST"]) || 0;

        if (!isNaN(any) && any >= 2011 && any <= 2025) {
          if (!datosAgrupados[any]) {
            datosAgrupados[any] = { forestal: 0, noforestal: 0 };
          }
          datosAgrupados[any].forestal += haForestal;
          datosAgrupados[any].noforestal += haNoForestal;
        }
      });

      const anys = Object.keys(datosAgrupados).map(Number).sort((a, b) => a - b);
      const superfForestals = anys.map(a => datosAgrupados[a].forestal);
      const superfNoForestals = anys.map(a => datosAgrupados[a].noforestal);

      const ctx = document.getElementById("graficoSuperficieAny").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: anys,
          datasets: [
            {
              label: "Superficie Forestal Quemada (ha)",
              data: superfForestals,
              borderColor: "green",
              backgroundColor: "rgba(0,128,0,0.1)",
              fill: true,
              tension: 0.2,
              pointRadius: 5
            },
            {
              label: "Superficie No Forestal Quemada (ha)",
              data: superfNoForestals,
              borderColor: "red",
              backgroundColor: "rgba(255,0,0,0.1)",
              fill: true,
              tension: 0.2,
              pointRadius: 5
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Superficie Total Quemada por Año en Cataluña (2011–2025)"
            }
          },
          scales: {
            x: {
              title: { display: true, text: "Año" }
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: "Superficie (ha)" }
            }
          }
        }
      });
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initSuperficiePorAny();
});
