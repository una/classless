import Ember from 'ember';
import BaseController from '../../../base';
import {
  METRICS_PRECISION,
  LB_DROPLET_STATUSES,
  COLLECTING_METRICS
} from '../../../../constants';

const TOOLTIP_TO_EDGE = 10;
const TOOLTIP_HORIZONTAL_OFFSET = 28;

const METRICS_PRETTY_NAMES_MAP = {
  'frontendReqDuration:0.5' : '50th percentile',
  'frontendReqDuration:0.9' : '90th percentile',
  'frontendReqDuration:0.99' : '99th percentile',
  'frontendReqPerSec:haproxy frontend requests per second' : 'Requests per second',
  'frontendConnections:haproxy frontend connections' : 'Connections',
  'frontendTrafficRecAndSent:haproxy frontend traffic received and sent' : 'Traffic received/sent'
};

const TO_DISPLAY_AS_INTEGER = [
  'frontendConnections',
  'frontendReqPerSec',
  'backendHealthChecks',
  'backendQueueSize',
  'backendDowntime'
];

const TO_ROUND_UP = [
  'frontendHttpResponses',
  'backendHttpResponses'
];

/* eslint-disable no-magic-numbers */
const NUMERIC_TIME_PERIODS = {
  'hour': 3600 * 6,
  'day': 3600 * 24,
  'week': 3600 * 24 * 7,
  'month': 3600 * 24 * 30
};
/* eslint-enable no-magic-numbers */

function normalizeTimeSeriesData(data, roundUp, precision) {
  return {
    unit: data.unit || '',
    name: data.name,
    data: data.values.map((v) => {
      let value = v.y;

      if (value) {
        value = roundUp
          ? Math.ceil(value)
          : value.toFixed(precision);
      } else {
        value = 0;
      }

      return {time: v.x.seconds, value: value};
    })
  };
}

function normalizeWithDefaultPrecision(data) {
  return normalizeTimeSeriesData(data, false, METRICS_PRECISION);
}

function normalizeWithIntegerValues(data) {
  return normalizeTimeSeriesData(data, false, 0);
}

function normalizeAndRoundUpValues(data) {
  return normalizeTimeSeriesData(data, true, 0);
}

function lastPointForDroplet(droplet, dataMap) {
  const data = dataMap.find(function(e) {
    return e.name === "node-" + droplet.id;
  });
  const v = data ? data.values[data.values.length - 1] : {};
  return v.y ? v.y : 0;
}

function tooltipYPosLimit() {
  return document.body.clientHeight + document.body.scrollTop - TOOLTIP_TO_EDGE;
}

let timeFormat = window.d3.time.format('%m-%d-%Y %I:%M %p');

export default BaseController.extend({
  trackPageName: 'Load Balancer Show Graphs',
  queryParams: ['period'],
  period: 'hour',
  graphColors: ['#1E77B4', '#A6CEE3', '#B4B4B4', '#A4A4A4', '#1ECEE3', '#2FCEE3'], // blue

  willDestroy: function() {
    this._super();
  },

  targetDropletsWithStats: function() {
    return this.get('model.droplets').map((droplet) => {
      const backendUpDroplets = this.get('model.backendUp');

      // If the LB API has targetDroplets but the metrics response doesn't, we
      // assume that we're still waiting on metrics for this load balancer.
      const isCollectingMetrics = this.get('model.loadBalancer.backendDropletCount') > 0
        && backendUpDroplets && backendUpDroplets.length === 0;

      let status;

      if (isCollectingMetrics) {
        status = LB_DROPLET_STATUSES.collectingMetrics;
      } else if (lastPointForDroplet(droplet, backendUpDroplets) > 0) {
        status = LB_DROPLET_STATUSES.up
      } else {
        status = LB_DROPLET_STATUSES.down;
      }

      return Ember.Object.create({
        droplet: droplet,
        status: status,
        lastDowntime: isCollectingMetrics
          ? COLLECTING_METRICS
          : lastPointForDroplet(droplet, this.get('model.backendDowntime')),
        lastQueueSize: isCollectingMetrics
          ? COLLECTING_METRICS
          : lastPointForDroplet(droplet, this.get('model.backendQueueSize')),
        // Round to 2 decimal places at most
        lastHealthChecks: isCollectingMetrics
          ? COLLECTING_METRICS
          : Math.round(
            lastPointForDroplet(droplet, this.get('model.backendHealthChecks')) * 100 // eslint-disable-line no-magic-numbers
          ) / 100 // eslint-disable-line no-magic-numbers
      });
    });
  }.property('model.droplets', 'model.loadBalancer'),

  targetDropletsNames: function() {
    let names = {};
    this.get('model.droplets').forEach(function(droplet) {
      names['node-' + droplet.id] = droplet.name;
    });
    return names;
  }.property('model.droplets'),

  numericPeriod: function() {
    return NUMERIC_TIME_PERIODS[this.get('period')];
  }.property('period'),

  frontendReqPerSec: function() {
    return this.get('model.frontendReqPerSec').map(normalizeWithIntegerValues);
  }.property('model.frontendReqPerSec'),

  frontendReqDuration: function() {
    return this.get('model.frontendReqDuration')
      .sortBy('name')
      // This ensures that the percentiles are displayed in descending order
      // (i.e. 99th, 90th, 50th).
      .reverse()
      .map(normalizeWithDefaultPrecision);
  }.property('model.frontendReqDuration'),

  frontendConnections: function() {
    return this.get('model.frontendConnections').map(normalizeWithIntegerValues);
  }.property('model.frontendConnections'),

  frontendTrafficRecAndSent: function() {
    return this.get('model.frontendTrafficRecAndSent').map(normalizeWithDefaultPrecision);
  }.property('model.frontendTrafficRecAndSent'),

  frontendHttpResponses: function() {
    return this.get('model.frontendHttpResponses').map(normalizeAndRoundUpValues);
  }.property('model.frontendHttpResponses'),

  backendDowntime: function() {
    return this.get('model.backendDowntime').map(normalizeWithIntegerValues);
  }.property('model.backendDowntime'),

  backendQueueSize: function() {
    return this.get('model.backendQueueSize').map(normalizeWithIntegerValues);
  }.property('model.backendQueueSize'),

  backendHttpResponses: function() {
    return this.get('model.backendHttpResponses').map(normalizeAndRoundUpValues);
  }.property('model.backendHttpResponses'),

  backendHealthChecks: function() {
    return this.get('model.backendHealthChecks').map(normalizeWithIntegerValues);
  }.property('model.backendHealthChecks'),

  loadBalancer: function() {
    return this.get('model.loadBalancer');
  }.property('model.loadBalancer'),

  graphsList: Ember.A([
    {name: 'frontend', caption: 'Frontend', unit: '', focusedVals: []},
    {name: 'frontendHttpResponses', caption: 'Frontend HTTP responses', unit: '', focusedVals: []},
    {name: 'frontendReqDuration', caption: 'Frontend requests duration', unit: 'ms', focusedVals: []},
    {name: 'backendDowntime', caption: 'Downtime', unit: 's', focusedVals: []},
    {name: 'backendQueueSize', caption: 'Queue size', unit: '', focusedVals: []},
    {name: 'backendHealthChecks', caption: 'health checks', unit: '%', focusedVals: []}
  ]),

  formattedFocusedDate: function() {
    if (this.get('commonFocusedDate')) {
      return timeFormat(this.get('commonFocusedDate'));
    } else {
      return '';
    }
  }.property('commonFocusedDate'),

  setupTooltip: function() {
    Ember.$('body').off('mousemove.common-tooltip');
    Ember.$('body').on('mousemove.common-tooltip', '.lb-graphs', (e) => {
      const tooltip = Ember.$('.common-tooltip');
      const wrapperOffset = Ember.$(e.currentTarget).offset();
      const tooltipW = tooltip.outerWidth();
      const tooltipH = tooltip.outerHeight();
      const yPosLimit = tooltipYPosLimit();
      let x = e.pageX;
      let y = e.pageY;

      /* eslint-disable no-magic-numbers */
      if (x + TOOLTIP_HORIZONTAL_OFFSET + tooltipW >= document.body.clientWidth - TOOLTIP_TO_EDGE) {
        x = x - tooltipW - 2 * TOOLTIP_HORIZONTAL_OFFSET;
      }

      if (y + tooltipH / 2 >= yPosLimit) {
        y = yPosLimit - tooltipH / 2;
      }

      tooltip.addClass('lb-graphs-tooltip');
      tooltip.css({ transform: `translate(${x + TOOLTIP_HORIZONTAL_OFFSET - wrapperOffset.left}px, ${y - tooltipH / 2 - wrapperOffset.top}px)` });
      /* eslint-enable no-magic-numbers */
    });
  }.observes('model'),

  actions: {
    onChangeGraphPeriod: function(period) {
      const droplets = this.getDropletsForLB();

      this.set('loading', true);
      this.set('period', period);

      this.getLoadBalancerStats(this.get('model.loadBalancer'), droplets, period)
      .then((res) => {
         this.setProperties({
           'model.frontendReqPerSec': res.frontendReqPerSec,
           'model.frontendConnections': res.frontendConnections,
           'model.frontendTrafficRecAndSent': res.frontendTrafficRecAndSent,
           'model.frontendHttpResponses': res.frontendHttpResponses,
           'model.frontendReqDuration': res.frontendReqDuration,
           'model.backendHttpResponses': res.backendHttpResponses,
           'model.backendDowntime': res.backendDowntime,
           'model.backendQueueSize': res.backendQueueSize,
           'model.backendHealthChecks': res.backendHealthChecks,
           'model.backendUp': res.backendUp
        });
        this.set('loading', false);
      });
    },

    onInsertChart: function(type, chart) {
      this.set(type + 'chart', chart);
    },

    updateTooltipValues: function(focusedVals) {
      if (focusedVals && focusedVals.length) {
        const chartName = focusedVals[0]['chartName'];
        const dropletsNames = this.get('targetDropletsNames');

        let graphsListEntry;
        if (chartName === 'frontendHttpResponses' || chartName === 'frontendReqDuration' || !chartName.match(/^frontend/)) {
          graphsListEntry = this.get('graphsList').findBy('name', chartName);
        } else {
          graphsListEntry = this.get('graphsList').findBy('name', 'frontend');
        }

        const precision = TO_DISPLAY_AS_INTEGER.indexOf(chartName) > -1
          ? 0
          : METRICS_PRECISION;

        const roundUp = TO_ROUND_UP.indexOf(chartName) > -1;

        if (graphsListEntry) {
          const tooltipFocusedVals = Ember.get(graphsListEntry, 'focusedVals').slice();

          focusedVals.forEach((v) => {
            const name = METRICS_PRETTY_NAMES_MAP[`${chartName}:${v.name}`]
              ? METRICS_PRETTY_NAMES_MAP[`${chartName}:${v.name}`]
              : v.name;

            const prettyName = dropletsNames[name] ? dropletsNames[name] : name;

            const valToUpdate = tooltipFocusedVals.findBy('name', prettyName);

            let value = v.value;

            if (typeof value === 'number') {
              value = roundUp ? Math.ceil(value) : value.toFixed(precision);
            }

            if (valToUpdate) {
              Ember.set(valToUpdate, 'value', value);
            } else {
              tooltipFocusedVals.push({
                name: prettyName,
                value: value,
                unit: v.unit,
                colorStyle: Ember.String.htmlSafe(`background-color: ${v.color}`)
              });
            }
          });

          Ember.set(graphsListEntry, 'focusedVals', tooltipFocusedVals);
        }
      }
    }
  }
});
