/* globals d3:false */
/* C3 Docs: http://c3js.org/reference.html */
import TimeSeriesChart from './time-series-chart';

const GRAPH_MAX_VALUES_MAPPING = {
  bandwidth_inbound : 1,
  bandwidth_outbound : 1,
  disk_read : 1,
  disk_write : 1,
  cpu : 100
};

export default TimeSeriesChart.extend({
  defaultYAxisFormat: function(d) {
      return d3.format('1.2f')(d) + ' ' + this.get('unit');
  },

  defaultTransitionDuration: function() {
    return null;
  },

  _updateChartLayout: function() {
    this._super(...arguments);
    let data = this.get('data');
    if (data.length) {
      let chart = this.get('chart');
      this.setChartYScale(chart, data);
    }
  }.observes('data'),

  setChartYScale: function(chart, data) {
    if (Object.keys(GRAPH_MAX_VALUES_MAPPING).indexOf(data[0].type) !== -1) {
      let maxVals = data.map((d) => {
        return d.chart_data.reduce((acc, p) => {
          if (p.value > acc) {
            acc = p.value;
          }
          return acc;
        }, 0);
      });

      maxVals[maxVals.length] = GRAPH_MAX_VALUES_MAPPING[data[0].type];

      chart.axis.max({y: Math.max(...maxVals)});
    } else {
      chart.internal.config.axis_y_max = undefined;
    }

    if (data[0].unit === '%') {
      chart.internal.loadConfig({
        axis: { y: { padding: { top: 0, bottom: 0 } } }
      });
    }
  },

  setup: function() {
    this._super(...arguments);

    let component = this;
    let chart = this.get('chart');
    let originalShowXGridFocus = chart.internal.showXGridFocus;

    chart.internal.showXGridFocus = function (selectedData) {
      originalShowXGridFocus.call(chart.internal, selectedData);

      if (component.get('isHovered')) {
        component.set('selectedXVal', selectedData[0].x);
      }
    };
  }.on('didInsertElement'),

  setChartXGridFocus: function() {
    let xVal = this.get('selectedXVal');
    if (this.get('tracksExteranlXVal') && !this.get('isHovered')) {
      let chartInternal = this.get('chart').internal;
      if (xVal > 0) {
        let index = chartInternal.getIndexByX(xVal);

        chartInternal.showXGridFocus([{
          x: this.get('selectedXVal'),
          value: 0,
          index: index
        }]);
      } else {
        chartInternal.hideXGridFocus();
      }
    }
  }.observes('selectedXVal', 'isHovered', 'tracksExteranlXVal'),

  mouseEnter: function() {
    this.set('isHovered', true);
  },
  mouseMove: function() {
    this.set('isHovered', true);
  },
  mouseLeave: function() {
    this.set('isHovered', false);
    this.set('selectedXVal', -1);
  }
});
