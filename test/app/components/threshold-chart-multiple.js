/* globals d3:false */
import Ember from 'ember';
import {
  MAX_PERCENTS
} from '../constants';

import LineChart from './line-chart';

const Y_RANGE_UPDATE_THROTTLE_MS = 320;

function valAccessor(d) { return d.value; }

export default LineChart.extend({

  mouseOverLineHandler: Ember.K,
  mouseOutLineHandler: Ember.K,
  mouseMoveLineHandler: Ember.K,

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

    svg.node().removeChild(this.get('mouseCapturer'));
  }.on('didInsertElement'),

  updateChart: function() {
    this._super();

    this.updateThreshold();
  }.observes('data'),

  getMaxY: function() {
    let linesData = this.get('linesData');
    let linesMeta = this.get('linesMeta');
    let yMaxVals = [];
    let yLine = this.get('yLine');

    linesData.forEach((d) => {
      yMaxVals.push(d3.max(d, valAccessor));
    });

    yMaxVals.push(parseFloat(yLine));

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

    let yLine = parseFloat(this.get('yLine'));

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
    this.setupYAxis();
    this.renderValueLines();
  },

  renderValueLines: function() {
    let lineSvg = this.get('lineSvg');
    let linesData = this.get('linesData');
    let linesMeta = this.get('linesMeta');
    let valuelineAccessor = function(d) { return this.get('valueline')(d.data); }.bind(this);
    let svg = this.get('svg');
    let y = this.get('y');

    let data = linesMeta.map((m, i) => {
      m.data = linesData[i];
      return m;
    });

    let lines = lineSvg.selectAll('g').data(data, d => d.lineId);

    let self = this;

    lines.exit().remove();

    lines
      .each(function() {
        let group = d3.select(this);
        group.select('.line')
          .attr("d", valuelineAccessor);
        group.select('.mouse-capturing')
          .attr("d", valuelineAccessor);
      });

    lines.enter().append('g')
      .each(function(d, i) {
        let group = d3.select(this);
        let dot = group.append('circle');
        let linesContainerElement = svg.select('.lines').node();

        dot
          .attr('class', 'mouse-tracking-dot')
          .attr('fill', self.get('palette')[i])
          .attr('cx', 0)
          .attr('cy', 0);

        group.append('path')
          .attr("class", "line")
          .attr('stroke', () => { return self.get('palette')[i]; })
          .attr("d", valuelineAccessor);

        group.append('path')
          .attr("class", "mouse-capturing")
          .attr('style', 'pointer-events: stroke; stroke: rgba(255,255,255,0.001); stroke-width: 7px; stroke-linejoin: round')
          .attr("d", valuelineAccessor)
          .on('mouseover', (d) => {
            self.get('mouseOverLineHandler')(d);
            group.attr('class', 'highlighted');
          })
          .on('mouseout', (d) => {
            self.get('mouseOutLineHandler')(d);
            group.attr('class', '');
          })
          .on('mousemove', (d) => {
            let linesDataInst = d.data;
            let xPos = d3.mouse(linesContainerElement)[0];
            let focusedDateInCurrentDataset = self.closestXInCurrentDataset(linesDataInst, xPos);

            if (focusedDateInCurrentDataset) {
              dot
                .attr('cy', y(focusedDateInCurrentDataset.value))
                .attr('cx', xPos);

              self.get('mouseMoveLineHandler')({
                dropletId: d.dropletId,
                metricName: d.name,
                metricUnit: d.unit,
                currentDate: focusedDateInCurrentDataset.date,
                value: focusedDateInCurrentDataset.value
              });
            }
          });
      });

    lines
      .each(function(d) {
        d3.select(this).select('.line')
          .attr('style', () => {
            let style = 'opacity: ' + (d.highlighted ? 0.999 : 0.30); // eslint-disable-line no-magic-numbers
            return style;
          });
      });
  }
});
