/* C3 Docs: http://c3js.org/reference.html */
import Ember from 'ember';
import _ from 'lodash';
import {DEBOUNCE_AMOUNT, MS_IN_SECONDS, RADIX} from '../constants';

const ONE_DAY = 24 * 60 * 60 * 1000; // eslint-disable-line no-magic-numbers
const TOOLTIP_TO_WIN_EDGE = 10;
const TOOLTIP_TO_MOUSE_X = 20;
const TRANSITION_DURATION = 650;

export default Ember.Component.extend({
  init() {
    let config = {
      data: {
        x: 'x',
        columns: [],
        empty: {
          label: {
            text: 'No Data Available For This Graph'
          }
        }
      },
      grid: {
        y: {
          show: true
        }
      },
      axis: {
        x: {
          type: 'timeseries'
        },
        y: {
          min: 0,
          ticks: 4,
          padding: {bottom: 0},
          tick: {
            count: 4,
            fit: true
          }
        }
      }
    };

    // This is needed so unit tests have a chart to reference
    let chart = window.c3.generate(config);

    this.set('chart', chart);
    this.set('unit', '');
    this._super(...arguments);
  },

  isEmpty: function() {
    let data = this.get('data');
    if (data) {
      return data.length === 0;
    } else {
      return true;
    }
  }.property('processedData'),

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      let self = this;
      let $elt = this.$('.aurora-droplet-graph').get(0);
      let chart = this.get('chart');

      let chart_config = {
        bindto: $elt,
        point: {
          show: false
        },
        transition: {
          duration: this.defaultTransitionDuration()
        },
        size: {
          height: 200
        },
        padding: {
          left: 85,
          right: 40
        },
        data: {
          x: 'x',
          columns: [],
          empty: {
            label: {
              text: 'No Data Available For This Graph'
            }
          }
        },
        grid: {
          y: {
            show: true
          }
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              values: this.get('xCols'),
              format: this.get('defaultXAxisFormat').bind(this)
            }
          },
          y: {
            min: 0,
            ticks: 4,
            padding: {bottom: 0},
            tick: {
              count: 4,
              fit: true,
              format: this.get('defaultYAxisFormat').bind(this)
            }
          }
        },
        color: {
          pattern: this.get('colors')
        },
        legend: {
          show: false
        },
        tooltip: {
          show: true,
          position: function (data, width, height) {
            let eventX, eventY;
            let halfHeight = height / 2; // eslint-disable-line no-magic-numbers
            if (window.event) {
              eventY = window.event.clientY;
              eventX = window.event.clientX;
            } else {
              eventY = this.get('mouseMoveY');
              eventX = this.get('mouseMoveX');
            }

            if (eventY >= document.body.clientHeight - halfHeight - TOOLTIP_TO_WIN_EDGE) {
              eventY = document.body.clientHeight - halfHeight - TOOLTIP_TO_WIN_EDGE;
            } else if (eventY <= halfHeight + TOOLTIP_TO_WIN_EDGE) {
              eventY = halfHeight + TOOLTIP_TO_WIN_EDGE;
            }

            if (eventX >= document.body.clientWidth - width - (TOOLTIP_TO_MOUSE_X + TOOLTIP_TO_WIN_EDGE)) {
              eventX = eventX - width - 2 * TOOLTIP_TO_MOUSE_X; // eslint-disable-line no-magic-numbers
            }

            return {
              top: eventY + window.pageYOffset - self.boundingRect.top - halfHeight,
              left: eventX + window.pageXOffset - self.boundingRect.left + TOOLTIP_TO_MOUSE_X
            };
          }.bind(this),
          contents: this._tooltipContents.bind(this)
        }
      };

      chart.internal.loadConfig(chart_config);
      chart.internal.init();

      Ember.$('body').on('mousemove.timeSeriesChart', (e) => {
        this.set('mouseMoveX', e.clientX);
        this.set('mouseMoveY', e.clientY);
      });

      // Resize dropdown on window resize
      Ember.$(window).on('resize.timeSeriesChart', () => {
        Ember.run.debounce(this, this._resizeHandler.bind(this), DEBOUNCE_AMOUNT);
      });

      this.boundingRect = $elt.getBoundingClientRect();

      // If we had data already loaded before we rendered, be sure to
      // run through the layout/data loading so it shows up correctly
      this._processIncomingData();
      this._updateChartLayout();

      this.sendAction('onInsertChart', this.get('type'), chart);
    });
  }.on('didInsertElement'),

  _resizeHandler: function() {
    let $elt = this.$('.aurora-droplet-graph');

    if($elt) {
      $elt = $elt.get(0);
      this.boundingRect = $elt.getBoundingClientRect();
    }
  },

  defaultXAxisFormat: function(x) {
    return window.d3.time.format(this.get('showDay') ? '%m/%e' : '%I:%M %p')(x);
  },

  defaultYAxisFormat: function(d) {
    let smallestYAxisTick = 0;

    return ((d) => {
      if(d && !smallestYAxisTick) {
        smallestYAxisTick = d;
      }
      let value = d;
      if(d % 1) {
        //if the label isn't an integer, format it with decimal places based on the smallest axis size
        value = window.d3.format(smallestYAxisTick > 100 ? '1.0f' : (smallestYAxisTick < 1 ? '1.3f' : (smallestYAxisTick < 10 ? '1.2f' : '1.1f')))(d); // eslint-disable-line no-magic-numbers
        //if the label ends in ".0" show it as an integer
        if(value % 1 === 0) {
          value = window.parseInt(value, RADIX);
        }
      }
      return value + ' ' + this.get('unit');
    })(d);
  },

  defaultTransitionDuration: function() {
    return TRANSITION_DURATION;
  },

  teardown: function() {
    Ember.$('body').off('mousemove.timeSeriesChart');
    Ember.$(window).off('resize.timeSeriesChart');
  }.on('willDestroyElement'),

  firstGraphData: function () {
    let data = this.get('processedData');
    if (data) {
      let firstGraph = this.get('data')[0];
      if(firstGraph && Array.isArray(firstGraph.data)) {
        return firstGraph.data;
      }
    }

    return [];
  }.property('processedData'),

  xCols: function () {
    let firstGraphData = this.get('firstGraphData');
    let colIndexOffsets = [0.065, 0.355, 0.645, 0.935].map(function (offset) { // eslint-disable-line no-magic-numbers
      return Math.floor(firstGraphData.length * offset);
    });
    if(!this.get('showDay')) {
      //if less than four days data, show 4 nicely spaced cols
      return colIndexOffsets.reduce(function(arr, offset) {
        if(firstGraphData[offset]) {
          arr.push(firstGraphData[offset].time * MS_IN_SECONDS);
        }
        return arr;
      }, []);
    }
    //if more than 4 days data, spread out the 4 cols our across the graph, while ensuring they're at the days start
    let cols = [];
    let i, prevDate, date;
    let len = firstGraphData.length;

    //find the first start of day in the data set
    for(i = 0; i < len; i++) {
      date = new Date(firstGraphData[i].time * MS_IN_SECONDS);
      if(prevDate && prevDate.getDay() !== date.getDay()) {
        cols.push(this._startOfDate(date));
        break;
      }
      prevDate = date;
    }
    //now find the last start of day in the data set
    prevDate = null;
    for(i = len - 1; i >= 0; i--) {
      date = new Date(firstGraphData[i].time * MS_IN_SECONDS);
      if(prevDate && prevDate.getDay() !== date.getDay()) {
        cols.push(this._startOfDate(prevDate));
        break;
      }
      prevDate = date;
    }

    //now find the two most spread out start of days between those days
    if(cols.length) {
      let daysBetweenFirstAndLast = (cols[1] - cols[0]) / ONE_DAY;
      //4 columns
      let stepSize = daysBetweenFirstAndLast / 3; // eslint-disable-line no-magic-numbers

      let second = new Date(cols[0]);
      second.setDate(cols[0].getDate() + Math.ceil(stepSize));

      let third = new Date(second);
      third.setDate(second.getDate() + Math.floor(stepSize));

      cols.splice(1, 0, second, third);
    }

    return cols;
  }.property('showDay', 'firstGraphData'),

  afterDataLoaded: Ember.K,

  _updateChartLayout: function() {
    let chart = this.get('chart');

    chart.internal.loadConfig({
      axis: { x: { tick: { values: this.get('xCols')} } }
    });

  }.observes('processedData'),

  _processIncomingData: function() {
    let data = this.get('data');
    if (data && data.length) {
      data = _.sortBy(data, 'data.length').reverse();
      let largestData = data[0];

      let metadata = {};
      let squareDataCounters = [];
      let squareData = [];
      let ii = 0;

      for (ii = 0; ii < data.length; ii++) {
        squareDataCounters.push(0);
        squareData.push([]);
      }

      for (let i = 0; i < largestData.data.length; i++) {
        let currentData = largestData.data[i];
        for (ii = 0; ii < data.length; ii++) {
          if (data[ii].data.length < squareDataCounters[ii]+1) {
            squareData[ii].push({time: currentData.time, value: null});
          } else if(data[ii].data[squareDataCounters[ii]].time < currentData.time) {
            squareData[ii].push({time: currentData.time, value: null});
          } else {
            let copyData = data[ii].data[squareDataCounters[ii]];
            squareData[ii].push({time: copyData.time, value: copyData.value});
            squareDataCounters[ii]++;
          }
        }
      }

      for (ii = 0; ii < data.length; ii++) {
        data[ii].data = squareData[ii];
      }

      data.forEach((d) => {
        metadata[`droplet-${d.id}`] = d;
      });

      this.set('metadata', metadata);
    }

    this.set('processedData', data);
  }.observes('data'),

  _updateChartData: function() {
    let data = this.get('processedData');

    if(data && data instanceof Array) {
      let chart = this.get('chart');

      let conf = this._dataToColumns(data);
      let lastIds = chart.data().map((v) => v.id);
      let currentIds = data.map((v) => `droplet-${v.id}`);
      let diff = _.difference(lastIds, currentIds);

      // https://github.com/c3js/c3/issues/23
      if (diff.length > 0) {
        conf.unload = diff;
      }

      if(data.length > 0) {
        this.set("unit", data[0].unit || "");
      }

      conf.done = this.get('afterDataLoaded').bind(this);
      chart.load(conf);
    }
  }.observes('processedData'),

  _startOfDate: function(date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  },

  _dataToColumns: function(data) {
    let conf = { columns : [] };

    if(data && data.length) {
      // Data is sorted largest to smallest in _processIncomingData
      conf.columns.push(['x'].concat(data[0].data.map(v => new Date(v.time * MS_IN_SECONDS))));

      conf = data.reduce((previousValue, currentValue) => {
        previousValue.columns.push([`droplet-${currentValue.id}`].concat(currentValue.data.map(v => v.value)));
        return previousValue;
      }, conf);
    }

    return conf;
  },

  showDay: function () {
    let firstGraphData = this.get('firstGraphData');
    if(!firstGraphData.length) {
      return true;
    }
    let diff = firstGraphData[firstGraphData.length - 1].time - firstGraphData[0].time;
    return (diff * MS_IN_SECONDS) >= (4 * ONE_DAY); // eslint-disable-line no-magic-numbers
  }.property('firstGraphData'),

  _tooltipContents: function(d, defaultTitleFormat, defaultValueFormat, color) {
    let i, ii, currentData, currentValue,
        dataIndex = d[0].index,
        html = "",
        name,
        // all graph info is used if we are displaying information from multiple graphs
        // for example: droplet show graphs
        allGraphInfo = this.get('allGraphInfo'),
        metadata = this.get('metadata');

    // display multiple graph data in tooltip
    let titleFormat = window.d3.time.format('%m-%d-%Y %I:%M %p');

    if(allGraphInfo) {
      for(i = 0; i < allGraphInfo.length; i++) {
        for(ii = 0; ii < allGraphInfo[i].data.length; ii++) {
          currentData = allGraphInfo[i].data[ii];
          currentValue = currentData && currentData.data[dataIndex] ? currentData.data[dataIndex].value : null;
          if(!i && !ii) {
            html += '<table class="c3-tooltip"><tr><th colspan="2">' + titleFormat(new Date(d[i].x)) + '</th></tr>';
          }

          name = currentData.name.replace('_', ' ');

          if ((currentValue || currentValue === 0) && name) {
            html += '<tr>';
            html += '<td class="name"><span style="background-color:' + allGraphInfo[i].colors[ii] + '"></span>' + name + '</td>';
            html += '<td class="value">' + currentValue + (currentData.unit || '') + '</td>';
            html += '</tr>';
          }
        }
      }
    } else { // display only this graph's data in the tooltip
      for(i = 0; i < d.length; i++) {
        currentData = d[i];
        // Can be null if droplets turned off/on over long period like 7 days
        if (currentData !== null) {
          if(!i) {
            html += '<table class="c3-tooltip"><tr><th colspan="2">' + titleFormat(new Date(currentData.x)) + '</th></tr>';
          }

          name = metadata[currentData.id].name.replace('_', ' ');

          if ((currentData.value || currentData.value === 0) && name) {
            html += '<tr>';
            html += '<td class="name"><span style="background-color:' + color(currentData.id) + '"></span>' + name + '</td>';
            html += '<td class="value">' + defaultValueFormat(currentData.value) + '</td>';
            html += '</tr>';
          }
        }
      }
    }

    html += "</table>";
    return html;
  }
});
