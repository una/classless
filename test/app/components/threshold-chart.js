/* globals d3:false */
import Ember from 'ember';
import {
  RADIX,
  MAX_PERCENTS
} from '../constants';

import LineChart from './line-chart';
import ChartTooltipMixin from '../mixins/chart-tooltip';

const Y_RANGE_UPDATE_THROTTLE_MS = 320;

function valAccessor(d) { return d.value; }

export default LineChart.extend(ChartTooltipMixin, {

  setup: function() {
    this._super();

    let svg = this.get('svg'),
      width = this.get('width'),
      height = this.get('height');

    // Group containing threshold indicator
    let threshold = svg.append('g');
    threshold.append('rect')
      .attr("class", "threshold-area")
      .attr({x: 0, width: width, y: height, height: 0});
    threshold.append('line')
      .attr("class", "threshold-border")
      .attr({x1: 0, x2: width, y1: 0, y2: 0});


    this.set('threshold', threshold);

  }.on('didInsertElement'),

  updateChart: function() {
    this._super();

    this.updateThreshold();
  }.observes('data'),

  setupYAxis: function(accountForYline) {
    if (accountForYline) {
      this.set('shouldAccountForYline', true);
    } else {
      this.set('shouldAccountForYline', false);
    }

    this._super();
  },

  getMaxY: function() {
    let linesData = this.get('linesData');
    let linesMeta = this.get('linesMeta');
    let yMaxVals = [];
    let yLine = this.get('yLine');

    linesData.forEach((d) => {
      yMaxVals.push(d3.max(d, valAccessor));
    });

    if (this.get('shouldAccountForYline') && !isNaN(yLine)) {
      yMaxVals.push(yLine);
    }

    yMaxVals.push(1);

    let maxY = d3.max(yMaxVals);

    if (linesMeta[0].unit === '%') {
      maxY = MAX_PERCENTS;
    }

    return maxY;
  },

  updateThreshold: function() {
    let threshold = this.get('threshold');
    let thresholdArea = threshold.select('rect');
    let thresholdBorder = threshold.select('line');
    let y = this.get('y');
    let height = this.get('height');

    let yLine = parseInt(this.get('yLine'), RADIX);

    let rectHeight = !isNaN(yLine) ? y(yLine) : 0;
    rectHeight = rectHeight >= 0 ? rectHeight : 0;

    if (this.get('condition') === 'ABOVE') {
      thresholdArea.attr({
          height: rectHeight,
          y: 0
        });
    } else {
      thresholdArea.attr({
        height: height - rectHeight,
        y: rectHeight
      });
    }

    thresholdBorder
      .attr({y1: rectHeight, y2: rectHeight});

    Ember.run.throttle(this, 'softChartUpdate', Y_RANGE_UPDATE_THROTTLE_MS, false);

  }.observes('yLine', 'condition'),

  softChartUpdate: function() {
    this.setupYAxis(true);
    this.renderValueLines();
    this.updateThreshold();
  }
});