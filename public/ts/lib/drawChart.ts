import Chart from 'chart.js/auto';

export default function drawChart(element, data) {
    Chart.defaults.color = '#000';

    new Chart(element, {
        type: 'line',
        options: {
            animation: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: true
              }
            }
        },
        data: {
          labels: data.map(row => row.date),
          datasets: [
            {
              label: 'Points',
              data: data.map(row => row.sum),
              borderColor: '#1D5410',
            }
          ]
        }
    });
}
