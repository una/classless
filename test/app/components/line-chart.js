/* globals d3:false */
import Ember from 'ember';
import {
  MS_IN_SECONDS,
  MAX_PERCENTS,
  ONE_THIRD,
  TWO_THIRDS
} from '../constants';
import adjustUnits from '../utils/adjust-units';

const CHART_WIDTH = 392;
const CHART_HEIGHT = 188;

const MARGIN_TOP = 3;
const MARGIN_RIGHT = 0;
const MARGIN_BOTTOM = 22;
const MARGIN_LEFT = 55;

const NUM_X_TICKS = 4;
const CHART_LINE_MARGIN = 0.1;

let bisectDate = d3.bisector(function(d) { return d.date; }).left;

function dateAccessor(d) { return d.date; }
function valAccessor(d) { return d.value; }

function sort(a, b) {
  if (a.time > b.time) { return 1; }
  if (b.time > a.time) { return -1; }
  return 0;
}

function parseDateTime(d) {
  d.date = new Date(d.time * MS_IN_SECONDS);
  d.value = +parseFloat(d.value);
}

export default Ember.Component.extend({

  classNameBindings: ['isEmpty:empty:loaded'],

  onFocusChanged: function() {},

  outerWidth: CHART_WIDTH,
  outerHeight: CHART_HEIGHT,

  useClipPath: false,

  setup: function() {
    let margin = {top: MARGIN_TOP, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT},
      width = this.get('outerWidth') - margin.left - margin.right,
      height = this.get('outerHeight') - margin.top - margin.bottom;

    // Set the ranges
    let x = d3.time.scale().range([0, width]);
    let y = d3.scale.linear().range([height, 0]);

    // Define the axes
    let xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(NUM_X_TICKS);

    let yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickSize(-width, 0);

    // Define the line
    let valueline = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.value); });

    // Adds the svg canvas
    let $me = this.$('.aurora-droplet-graph');
    let svg = d3.select($me.get(0))
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    if (this.get('useClipPath')) {
      svg.append("defs").append("clipPath")
        .attr("id", `${this.get('elementId')}-clip`)
        .append("rect")
        .attr("width", width)
        .attr("height", height);
    }

    // Group containing graph lines
    let lineSvg = svg.append("g")
      .attr('class', 'lines');

    // Group containing mouse focus vertical line
    let focus = svg.append("g")
      .style("display", "none");

    focus.append("line")
      .attr("class", "y-focus")
      .attr({x1: 0, y1: 0, x2: 0, y2: height});

    // Append the rectangle to capture mouse
    let mouseCapturer = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => {
        this.set('isFocused', !this.get('isEmpty'));
      })
      .on("mouseout", () => {
        this.set('isFocused', false);
      })
      .on("mousemove", this.trigger.bind(this, 'mousemove'));

    this.setProperties({
      x: x,
      y: y,
      xAxis: xAxis,
      yAxis: yAxis,
      valueline: valueline,
      svg: svg,
      lineSvg: lineSvg,
      focus: focus,
      height: height,
      width: width,
      mouseCapturer: mouseCapturer.node()
    });

    if (this.get('data.length')) {
      Ember.run.next(this, 'updateChart');
    }

  }.on('didInsertElement'),

  updateChart: function() {
    if (this.get('isEmpty')) { return; }

    let linesData = this.get('data').map(d => Array.prototype.slice.call(d.data));
    let linesMeta = this.get('data').map(d => {
      let res = {};
      for (let key in d) {
        if (key !== 'data') {
          res[key] = d[key];
        }
      }
      return res;
    });

    linesData.sort((a, b) => {
      if (a.length > b.length) { return -1; }
      if (a.length < b.length) { return 1; }
      return 0;
    });

    linesData.forEach((d) => {
      d.sort(sort);
      d.forEach(parseDateTime);
    });

    let linesDateToIndex = linesData.map((linesDataInst) => {
      return linesDataInst.map((d) => {
        return d.date.toString();
      });
    });

    this.setProperties({
      linesData: linesData,
      linesMeta: linesMeta,
      linesDateToIndex: linesDateToIndex
    });

    this.setupYAxis();
    this.setupXAxis();
    this.renderValueLines();

  }.observes('data'),

  closestXInCurrentDataset: function(lineData, xPos) {
    let x = this.get('x'),
      x0 = x.invert(xPos),
      i = bisectDate(lineData, x0),

      d0 = lineData[i - 1],
      d1 = lineData[i],

      d;

    if (d0 && d1) {
      d = x0 - d0.date > d1.date - x0 ? d1 : d0;

      return d;
    }

    return null;
  },

  mousemoveHandler: function() {
    if (this.get('isEmpty')) { return; }

    let x = this.get('x');
    let d = x.invert(d3.mouse(this.get('mouseCapturer'))[0]);

    if (d) {
      this.set('focusedDate', d);
    }
  }.on('mousemove'),

  focusLinePosition: function() {
    if (this.get('isEmpty')) { return; }

    let focus = this.get('focus'),
      d = this.get('focusedDate'),
      x = this.get('x')(d);

      if (x < 0) {
        x = 0;
        this.set('isFocused', false);
      }

    focus.select("line.y-focus")
      .attr("transform", `translate(${x}, 0)`);
  }.observes('focusedDate'),

  focusLineVisibility: function() {
    if (this.get('isEmpty')) { return; }

    let focus = this.get('focus');

    if (this.get('isFocused')) {
      focus.style("display", null);
    } else {
      focus.style("display", "none");
    }
  }.observes('isFocused'),

  updateFocusedValues: function() {
    if (this.get('isEmpty')) { return; }

    let linesData = this.get('linesData') || [],
      linesMeta = this.get('linesMeta') || [],
      linesDateToIndex = this.get('linesDateToIndex'),
      x = this.get('x'),
      xPos = x(this.get('focusedDate'));


    let focusedValues = linesData.map((linesDataInst, j) => {

      let focusedDateInCurrentDataset = this.closestXInCurrentDataset(linesDataInst, xPos);
      let i;

      if (focusedDateInCurrentDataset) {
        i = linesDateToIndex[j].indexOf(focusedDateInCurrentDataset.date.toString());
      }

      return {
        chartName: this.get('name'),
        name: linesMeta[j].name,
        value: i >= 0 ? linesDataInst[i].value : 'N/A',
        unit: linesMeta[j].unit,
        date: this.get('focusedDate'),
        color: this.get('palette')[j]
      };
    });

    this.set('focusedValues', focusedValues);
    this.get('onFocusChanged')(focusedValues);
  }.observes('focusedDate'),

  setupYAxis: function() {
    let svg = this.get('svg');
    let y = this.get('y');
    let yAxis = this.get('yAxis');
    let linesMeta = this.get('linesMeta');
    let unit = linesMeta[0].unit;

    yAxis.tickFormat(function(d) {
      if (linesMeta[0].unit === '%') {
        return d3.format("%")(d/100); // eslint-disable-line no-magic-numbers
      } else if (d < 1) {
        return adjustUnits(d, unit, 2); // eslint-disable-line no-magic-numbers
      } else {
        return adjustUnits(d, unit, 3); // eslint-disable-line no-magic-numbers
      }
    });

    let maxY = this.getMaxY();

    yAxis.tickValues([maxY * ONE_THIRD, maxY * TWO_THIRDS, maxY]);
    y.domain([0, maxY * (1 + CHART_LINE_MARGIN)]);

    // Add the Y Axis
    svg.select('.y.axis').remove();
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    this.set('y', y);
  },

  getMaxY: function() {
    let linesData = this.get('linesData');
    let linesMeta = this.get('linesMeta');
    let yMaxVals = [];

    linesData.forEach((d) => {
      yMaxVals.push(d3.max(d, valAccessor));
    });

    yMaxVals.push(1);

    let maxY = d3.max(yMaxVals);

    if (linesMeta[0].unit === '%') {
      maxY = MAX_PERCENTS;
    }

    return maxY;
  },

  setupXAxis: function() {
    let svg = this.get('svg');
    let x = this.get('x');
    let xAxis = this.get('xAxis');
    let linesData = this.get('linesData');
    let height = this.get('height');
    let range = this.get('range') || 3600 * 6; // eslint-disable-line no-magic-numbers
    range = range * 1000; // eslint-disable-line no-magic-numbers

    let latestTime = linesData.reduce((acc, d) => {
      return Math.max(d3.max(d, dateAccessor), acc);
    }, 0);

    x.domain([new Date(latestTime - range), new Date(latestTime)]);

    // Add the X Axis
    svg.select('.x.axis').remove();
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
  },

  renderValueLines: function() {
    let lineSvg = this.get('lineSvg');
    let linesData = this.get('linesData');
    let valueline = this.get('valueline');

    // Add the valueline path.
    lineSvg.selectAll('path').remove();
    linesData.forEach((d, i) => {
      lineSvg.append("path")
        .attr("class", "line")
        .attr('stroke', this.get('palette')[i])
        .attr("d", valueline(d));

      if (this.get('useClipPath')) {
        lineSvg.attr("clip-path", `url(#${this.get('elementId')}-clip)`)
      }
    });
  },

  isEmpty: function() {
    let ary = this.get('data');
    let x = ary && ary[0] && ary[0].data && ary[0].data.length;
    return !x;
  }.property('data')

});
