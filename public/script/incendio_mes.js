function initIncendios() {
  Papa.parse('/public/datos/Incendis_con_coordenades_complet (1).csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      const data = results.data.filter(row => row['DATA INCENDI']);
      const incendiosPorMes = new Array(12).fill(0);

      data.forEach(row => {
        const partes = row['DATA INCENDI'].split('/');
        if (partes.length === 3) {
          const fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          if (!isNaN(fecha)) {
            const mes = fecha.getMonth(); // 0 = enero, 11 = diciembre
            incendiosPorMes[mes]++;
          }
        }
      });

      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'

      ];

      const ctx = document.getElementById('graficoIncendisMes').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: meses,
          datasets: [{
            label: 'Nombre d\'incendis per mes',
            data: incendiosPorMes,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Nombre d\'incendis'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Mes'
              }
            }
          }
        }
      });
    }
  });
}
