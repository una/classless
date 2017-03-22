import Ember from 'ember';
import { get } from '../utils/apiHelpers';
import ENV from '../config/environment';

function normalizeTimeSeriesData(data) {
  return {
    unit: data.unit,
    name: data.name,
    dropletId: data.dropletId || data.droplet_id,
    data: data.values.map((v) => {
      return {
        time: v.x.seconds,
        value: v.y || 0
      };
    })
  };
}

function aggregateCPUData(data) {
  let aggregateData = data.reduce((acc, d) => {
    d.data.forEach((point, i) => {
      if (!acc[i]) { acc[i] = {value: 0, time: 0}; }
      acc[i].value += point.value;
      acc[i].time = point.time;
    });

    return acc;
  }, []);

  return {
    name: 'cpu_total',
    unit: '%',
    dropletId: data[0].dropletId,
    data: aggregateData
  };
}

export default Ember.Service.extend({

  getMetricsForDroplets: function(dropletIds, type, period) {
    let filteredPeriod = period === 'hour' ? '6hour' : period;
    let formattedIds = dropletIds.map(id => `droplet_ids[]=${id}`).join('&');
    let uri = `/${ENV['api-namespace']}/radar/combined_metrics/${type}/for_droplets?${formattedIds}&period=${filteredPeriod}`;

    return get(uri).then((resp) => {
      return resp.json();
    }).then((json) => {
      return json.stat.map(normalizeTimeSeriesData);
    }).catch(() => {
      return [];
    });
  },

  getChartDataForDroplets: function(dropletIds, metric, period) {
    let metricType = metric.radarEndpoint;

    return this.getMetricsForDroplets(dropletIds, metricType, period).then((res) => {
      if (metric.machineName === 'CPU_TOTAL') {
        let grouppedByDroplet = res.reduce((acc, item) => {
          if (!acc[item.dropletId + '']) {
            acc[item.dropletId + ''] = [];
          }
          acc[item.dropletId + ''].push(item);
          return acc;
        }, {});

        return Object.keys(grouppedByDroplet).map((dropletId) => {
          return aggregateCPUData(grouppedByDroplet[dropletId]);
        });
      } else if (metric.machineName === 'PUBLIC_INBOUND' || metric.machineName === 'PUBLIC_OUTBOUND') {
        return res.filter((item) => {
          item.unit = metric.unit;
          return item.name === 'eth0';
        });
      } else if (metric.machineName === 'DISK_READ' || metric.machineName === 'DISK_WRITE') {
        return res.filter((item) => {
          item.unit = metric.unit;
          return item.name === 'vda';
        });
      } else {
        return res.map((item) => {
          item.unit = metric.unit;
          return item;
        });
      }
    });
  }
});
