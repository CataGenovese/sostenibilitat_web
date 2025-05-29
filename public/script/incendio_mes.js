function initIncendios() {
  Papa.parse("/public/datos/Incendis_con_coordenades_complet (1).csv", {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;
      const meses = Array(12).fill(0);

      data.forEach(row => {
        const fecha = new Date(row["DATA INCENDI"]);
        const year = fecha.getFullYear();

        if (!isNaN(fecha) && year >= 2011 && year <= 2025) {
          const mes = fecha.getMonth(); // 0 = Gener, 11 = Desembre
          meses[mes]++;
        }
      });

      const etiquetas = [
        "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
        "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"
      ];

      const ctx = document.getElementById("graficoIncendisMes").getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: etiquetas,
          datasets: [{
            label: "Nombre d'Incendis",
            data: meses,
            backgroundColor: "orange"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Incendis per Mes a Catalunya (2011–2025)"
            }
          },
          scales: {
            x: {
              title: { display: true, text: "Mes" }
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: "Nombre d'Incendis" }
            }
          }
        }
      });
    }
  });
}
