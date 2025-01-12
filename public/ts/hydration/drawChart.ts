import Chart from 'chart.js/auto';
import { ChartData } from '../types.js';

const drawChart = (element: HTMLElement, data: ChartData[]) => {
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
};

export const renderChart = (templateData) => {
  const chartData: ChartData[] = templateData.results.reverse();
  chartData.forEach((item, index) => {
      if (index === 0) {
          item.sum = item.points;
      } else {
          item.sum = chartData[index-1].sum + item.points;
      }
  })

  const chartElement = document.getElementById('chart');
  if (chartElement) {
      drawChart(chartElement, chartData);
  }
};
