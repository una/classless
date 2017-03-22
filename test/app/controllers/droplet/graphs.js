import Ember from 'ember';
import BaseController from '../base';
import App from '../../app';
import {
  METRICS_PRECISION,
  MS_IN_SECONDS,
  MS_IN_ONE_HOUR,
  MILLION_MULTIPLIER,
  MAX_PERCENTS,
  PRIV_NETWORK_INTERFACE_NAMES,
  STATUS_CODE_UNAUTHORIZED,
  STATUS_CODE_FORBIDDEN
} from '../../constants';
import _ from 'lodash/lodash';

const TOOLTIP_HORIZONTAL_OFFSET = 15;
const HALFS = 2;
const TOOLTIP_TO_EDGE = 10;
const FIVE_MIN = 300 * MS_IN_SECONDS; // eslint-disable-line no-magic-numbers

const METRICS_PRETTY_NAMES_MAP = {
  'cpu:user' : 'User',
  'cpu:sys' : 'System',
  'cpu:system' : 'System',
  'memory:RAM usage' : 'Used',
  'disk:read' : 'Read',
  'disk:write' : 'Write',
  'diskUsage:/' : 'Local',
  'bandwidthPublic:public_inbound' : 'Public - inbound',
  'bandwidthPublic:public_outbound' : 'Public - outbound'
};

const AGENT_INCOMPATIBLE_IMAGES = [
  'FreeBSD',
  'CoreOS',
  'Fedora'
];

const NUMERIC_TIME_PERIODS = {
  'hour': 3600 * 6, // eslint-disable-line no-magic-numbers
  'day': 3600 * 24, // eslint-disable-line no-magic-numbers
  'week': 3600 * 24 * 7, // eslint-disable-line no-magic-numbers
  'month': 3600 * 24 * 30 // eslint-disable-line no-magic-numbers
};

function byTimeDesc(a,b) {
  if(a.time > b.time) {
    return -1;
  } else if (a.time === b.time) {
    return 0;
  }
  return 1;
}

function byValueDesc(a,b) {
  if(a.value > b.value) {
    return -1;
  } else if (a.value === b.value) {
    return 0;
  }
  return 1;
}

function normalizeData(stats) {
  stats.data = stats.data.reverse();
  return stats;
}

function normalizeTimeSeriesData(data) {
  return {
    unit: data.unit,
    name: data.name,
    data: data.values.map((v) => {
      return {
        time: v.x.seconds,
        value: v.y ? v.y.toFixed(METRICS_PRECISION) : 0
      };
    })
  };
}

function normalizeTopProcesses(type, max) {
  return function(data) {
    const v = data.values.map((v) => {
      let value = v.y || 0;
      let pct = 0;
      let toolTipText = '';

      if(type === 'cpu') {
        pct = value * MAX_PERCENTS;

      } else if (type === 'memory') {
        value = value / MILLION_MULTIPLIER;
        pct = value / max * MAX_PERCENTS;
        toolTipText = `${value.toFixed(METRICS_PRECISION)}Mb`;
      }

      return {
        time: v.x.seconds,
        value: value,
        valuePct: pct.toFixed(METRICS_PRECISION) + '%',
        toolTipText: toolTipText
      };
    }).sort(byTimeDesc)[0];

    return {
      unit: data.unit,
      name: data.name,
      value: v.value,
      valuePct: v.valuePct,
      toolTipText: v.toolTipText
    };
  };
}

function tooltipYPosLimit() {
  return document.body.clientHeight + document.body.scrollTop - TOOLTIP_TO_EDGE;
}

let timeFormat = window.d3.time.format('%m-%d-%Y %I:%M %p');

export default BaseController.extend({
  trackPageName: 'Droplet Show Graphs',
  queryParams: ['period'],
  period: 'hour',
  bandwidthColors: ['#693D9A', '#CAB2D6'], // purple
  cpuColors: ['#1E77B4', '#A6CEE3'], // blue
  diskColors: ['#32A02B', '#B2DF8A'], // green
  tooltipValues: Ember.A(),
  monitoringEnabled: App.featureEnabled('monitoringPreferences'),
  topProcessesEnabled: App.featureEnabled('insightsTopProcesses'),
  agentInstallationNotificationDismissed: window.localStorage['agentInstallationNotificationDismissed'],

  redirectToLogin: function() {
    window.location.href = '/login';
  },

  validateServiceStatus: function() {
    let droplet = this.get('model.droplet');
    let timeseriesServiceStatus = droplet.get('timeseriesServiceStatus');
    let statisticsServiceStatus = droplet.get('statisticsServiceStatus');
    let isClientErrorStatus = function(statusCode) {
      return [STATUS_CODE_UNAUTHORIZED, STATUS_CODE_FORBIDDEN].indexOf(statusCode) !== -1;
    };

    if(isClientErrorStatus(timeseriesServiceStatus) || isClientErrorStatus(statisticsServiceStatus)) {
      this.redirectToLogin();
    }
  }.observes('model.droplet.timeseriesServiceStatus', 'model.droplet.statisticsServiceStatus'),

  notEnoughGraphData: function() {
    let latestStartMetric;

    if (this.get('shouldSeeNewCharts')) {
      // Taking only memory and CPU metric into account when defining amount of acquired data
      // for old graphs
      latestStartMetric = Math.max.apply(null, ['memory', 'tsCPU'].map((metric) => {
        if (this.get(`model.${metric}`).length) {
          return Math.min.apply(null, this.get(`model.${metric}`)[0].values.map((v) => {
            return v.x.seconds;
          }));
        } else {
          return 0;
        }
      }));
    } else {
      // Taking only cpu and bandwidth metric into account when defining amount of acquired data
      // for old graphs
      latestStartMetric = Math.max.apply(null, ['cpu', 'bandwidth'].map((metric) => {
        if (this.get(`model.${metric}`).length) {
          return Math.min.apply(null, this.get(`model.${metric}`)[0].data.map((v) => {
            return v.time;
          }));
        } else {
          return 0;
        }
      }));
    }

    return Date.now() - latestStartMetric * MS_IN_SECONDS <= FIVE_MIN;
  }.property('model.tsCPU', 'model.memory', 'model.cpu', 'model.bandwidth'),

  shouldSeeNewCharts: function() {
    return this.get('model.droplet').get('metricsAvailable');
  }.property('model.droplet.metricsAvailable'),

  numericPeriod: function() {
    return NUMERIC_TIME_PERIODS[this.get('period')];
  }.property('period'),

  setupTooltip: function() {
    if(this.get('shouldSeeNewCharts')) {
      Ember.$('body').off('mousemove.common-tooltip');
      Ember.$('body').on('mousemove.common-tooltip', '.droplet_graphs', (e) => {
        let tooltip = Ember.$('.common-tooltip');
        let wrapperOffset = Ember.$(e.currentTarget).offset();
        let x = e.pageX;
        let y = e.pageY;
        let tooltipW = tooltip.outerWidth();
        let tooltipH = tooltip.outerHeight();
        let yPosLimit = tooltipYPosLimit();

        if (x + TOOLTIP_HORIZONTAL_OFFSET + tooltipW >= document.body.clientWidth - TOOLTIP_TO_EDGE) {
          x = x - tooltipW - 2 * TOOLTIP_HORIZONTAL_OFFSET; // eslint-disable-line no-magic-numbers
        }

        if (y + tooltipH/HALFS >= yPosLimit) {
          y = yPosLimit - tooltipH/HALFS;
        }

        tooltip.css({transform: `translate(${x + TOOLTIP_HORIZONTAL_OFFSET - wrapperOffset.left}px, ${y - tooltipH/HALFS - wrapperOffset.top}px)`});
      });
    }
  }.observes('model', 'shouldSeeNewCharts'),

  willDestroy: function() {
    this._super();
    Ember.$('body').off('mousemove.common-tooltip');
  },

  allGraphInfo: function() {
    return [
      {data: this.get('bandwidthPublic'), colors: this.get('bandwidthColors'), unit: 'Mbps'},
      {data: this.get('bandwidthPrivate'), colors: this.get('bandwidthColors'), unit: 'Mbps'},
      {data: this.get('bandwidthManagement'), colors: this.get('bandwidthColors'), unit: 'Mbps'},
      {data: this.get('cpu'), colors: this.get('cpuColors'), unit: '%'},
      {data: this.get('disk'), colors: this.get('diskColors'), unit: 'MB/s'}
    ];
  }.property('model.bandwidth', 'model.cpu', 'model.disk'),

  bandwidthPublic: function () {
    return this.get('model.bandwidth').map(normalizeData).filter(function (series) {
      return series.name.match(/^public_/);
    });
  }.property('model.bandwidth'),

  bandwidthPrivate: function () {
    return this.get('model.bandwidth').map(normalizeData).filter(function (series) {
      return series.name.match(/^private_/);
    });
  }.property('model.bandwidth'),

  bandwidthManagement: function () {
    return this.get('model.bandwidth').map(normalizeData).filter(function (series) {
      return series.name.match(/^management_/);
    });
  }.property('model.bandwidth'),

  cpu: function () {
    return this.get('model.cpu').map(normalizeData);
  }.property('model.cpu'),

  disk: function () {
    return this.get('model.disk').map(normalizeData);
  }.property('model.disk'),

  memory: function () {
    return this.get('model.memory').map(normalizeTimeSeriesData);
  }.property('model.memory'),

  diskUsage: function () {
    return this.get('model.diskUsage').map(normalizeTimeSeriesData);
  }.property('model.diskUsage'),

  tsCPU: function () {
    return this.get('model.tsCPU')
      .filter((series) => { return series.name !== 'iowait'; })
      .map(normalizeTimeSeriesData);
  }.property('model.tsCPU'),

  tsDiskIO: function () {
    try {
      if (!this.get('shouldSeeNewCharts')) {
        throw new Error('Feature is not available.');
      }
      let diskRead = this.get('model.tsDiskIORead')[0];
      let diskWrite = this.get('model.tsDiskIOWrite')[0];

      let diskIO = [
        {
          unit: 'MB/s',
          name: 'Read',
          values: diskRead.values
        },
        {
          unit: 'MB/s',
          name: 'Write',
          values: diskWrite.values
        }
      ].map(normalizeTimeSeriesData);

      return diskIO;
    } catch (e) {
      Ember.Logger.log(e);
      return false;
    }
  }.property('model.tsDiskIORead', 'model.tsDiskIOWrite'),

  tsBandwidthPub: function () {
    try {
      if (!this.get('shouldSeeNewCharts')) {
        throw new Error('Feature is not available.');
      }

      let publicBandwidthIn = this.get('model.tsBandwidthIn').filter((series) => { return series.name === 'eth0'; });
      let publicBandwidthOut = this.get('model.tsBandwidthOut').filter((series) => { return series.name === 'eth0'; });

      let hasPublicBandwidthIn = publicBandwidthIn[0].values.filter((v) => { return typeof v.y !== 'undefined'; });
      let hasPublicBandwidthOut = publicBandwidthOut[0].values.filter((v) => { return typeof v.y !== 'undefined'; });

      if (!hasPublicBandwidthIn.length || !hasPublicBandwidthOut.length) {
        throw new Error('Droplet does not have public bandwidth.');
      }

      let publicBandwidth = [
        {
          unit: 'Mbps',
          name: 'Public — Inbound',
          values: publicBandwidthIn[0].values
        },
        {
          unit: 'Mbps',
          name: 'Public — Outbound',
          values: publicBandwidthOut[0].values
        }
      ].map(normalizeTimeSeriesData);

      return publicBandwidth;
    } catch (e) {
      Ember.Logger.log(e);
      return false;
    }
  }.property('model.tsBandwidthIn', 'model.tsBandwidthOut'),

  tsBandwidthPriv: function () {
    try {
      if (!this.get('shouldSeeNewCharts')) {
        throw new Error('Feature is not available.');
      }

      let privateBandwidthIn = this.get('model.tsBandwidthIn')
        .filter((series) => { return PRIV_NETWORK_INTERFACE_NAMES.indexOf(series.name) !== -1; });
      let privateBandwidthOut = this.get('model.tsBandwidthOut')
        .filter((series) => { return PRIV_NETWORK_INTERFACE_NAMES.indexOf(series.name) !== -1; });

      let hasPrivateBandwidthIn = privateBandwidthIn[0].values.filter((v) => { return typeof v.y !== 'undefined'; });
      let hasPrivateBandwidthOut = privateBandwidthOut[0].values.filter((v) => { return typeof v.y !== 'undefined'; });

      if (!hasPrivateBandwidthIn.length || !hasPrivateBandwidthOut.length) {
        throw new Error('Droplet does not have private bandwidth.');
      }

      let privateBandwidth = [
        {
          unit: 'Mbps',
          name: 'Private — Inbound',
          values: privateBandwidthIn[0].values
        },
        {
          unit: 'Mbps',
          name: 'Private — Outbound',
          values: privateBandwidthOut[0].values
        }
      ].map(normalizeTimeSeriesData);

      return privateBandwidth;
    } catch (e) {
      Ember.Logger.log(e);
      return false;
    }
  }.property('model.tsBandwidthIn', 'model.tsBandwidthOut'),

  tsTopProcessesByMemory: function() {
    return this.get('model.tsTopProcessesByMemory').
      map(normalizeTopProcesses('memory', this.get('model.droplet.memory'))).
      sort(byValueDesc).
      slice(0, 7); // eslint-disable-line no-magic-numbers
  }.property('model.tsTopProcessesByMemory'),

  tsTopProcessesByCPU: function() {
    return this.get('model.tsTopProcessesByCPU').
      map(normalizeTopProcesses('cpu', 1)). // eslint-disable-line no-magic-numbers
      sort(byValueDesc).
      slice(0, 7); // eslint-disable-line no-magic-numbers
  }.property('model.tsTopProcessesByCPU'),

  lastTimeseriesTick: function() {
    let data = this.get('model.memory')[0];

    if (data && data.values.length > 0) {
      let lastPoint = data.values[data.values.length-1];
      return new Date(lastPoint.x.seconds * MS_IN_SECONDS);
    }

    return null;
  }.property('model.memory'),

  lastTopProcessCPUTick: function() {
    let data = this.get('model.tsTopProcessesByCPU')[0];

    if (data && data.values.length > 0) {
      let lastPoint = data.values[data.values.length-1];
      return new Date(lastPoint.x.seconds * MS_IN_SECONDS);
    }

    return null;
  }.property('model.tsTopProcessesByCPU'),

  graphsList: Ember.A([
    {name: 'cpu', caption: 'CPU', unit: '%', focusedVals: []},
    {name: 'memory', caption: 'Memory', unit: '%', focusedVals: []},
    {name: 'disk', caption: 'Disk I/O', unit: 'MB/s', focusedVals: []},
    {name: 'diskUsage', caption: 'Disk usage', unit: '%', focusedVals: []},
    {name: 'bandwidth', caption: 'Bandwidth', unit: 'Mbps', focusedVals: []}
  ]),

  formattedFocusedDate: function() {
    if (this.get('commonFocusedDate')) {
      return timeFormat(this.get('commonFocusedDate'));
    } else {
      return '';
    }
  }.property('commonFocusedDate'),

  agentCompatible: function() {
    let droplet = this.get('model.droplet');
    let image = droplet.get('image');
    return _.indexOf(AGENT_INCOMPATIBLE_IMAGES, image.get('distributionName')) === -1;
  }.property('model.droplet'),

  shouldShowAgentInstallationNotification: function() {
   return !this.get('model.droplet').get('metricsAvailable') && !this.get('agentInstallationNotificationDismissed');
  }.property('model.droplet.metricsAvailable', 'agentInstallationNotificationDismissed'),

  shouldShowAgentInformationLink: function() {
    return !this.get('model.droplet').get('metricsAvailable') && this.get('agentInstallationNotificationDismissed');
  }.property('model.droplet.metricsAvailable', 'agentInstallationNotificationDismissed'),

  shouldShowStaleDataNotification: function() {
    let now = new Date();
    let last_timestamp = this.get('lastTimeseriesTick');
    if (last_timestamp) {
      return (now - last_timestamp) > MS_IN_ONE_HOUR;
    }
    return false;
  }.property('model.droplet.metricsAvailable', 'lastTimeseriesTick'),

  shouldShowMetricsServiceError: function() {
    return !this.get('model.droplet').get('shouldShowAgentInstallationNotification') && !this.get('model.droplet').get('metricsServiceAvailable');
  }.property('model.droplet.metricsServiceAvailable'),

  actions: {
    onChangeGraphPeriod: function(period) {
      this.set('loading', true);
      this.set('period', period);

      this.getDropletStats(this.get('droplet'), period)
      .then((res) => {
        this.set('model', res);
        this.set('loading', false);
      });
    },
    loading: function() {
      this.set('loading', true);
    },
    onInsertChart: function(type, chart) {
      this.set(type + 'chart', chart);
    },

    updateTooltipValues: function(focusedVals) {
      if (focusedVals && focusedVals.length) {
        let chartName = focusedVals[0]['chartName'];

        let graphsListEntry;

        if (chartName.match(/^bandwidth/)) {
          graphsListEntry = this.get('graphsList').findBy('name', 'bandwidth');
        } else {
          graphsListEntry = this.get('graphsList').findBy('name', chartName);
        }

        if (graphsListEntry) {
          let tooltipFocusedVals = Ember.get(graphsListEntry, 'focusedVals').slice();

          focusedVals.forEach((v) => {
            let name = METRICS_PRETTY_NAMES_MAP[`${chartName}:${v.name}`]
              ? METRICS_PRETTY_NAMES_MAP[`${chartName}:${v.name}`]
              : v.name;

            let valToUpdate = tooltipFocusedVals.findBy('name', name);

            let value = typeof v.value === 'number' ? v.value.toFixed(2) : v.value; // eslint-disable-line no-magic-numbers

            if (valToUpdate) {
              Ember.set(valToUpdate, 'value', value);
            } else {
              tooltipFocusedVals.push({
                name: name,
                value: value,
                unit: v.unit,
                colorStyle: Ember.String.htmlSafe(`background-color: ${v.color}`)
              });
            }
          });

          Ember.set(graphsListEntry, 'focusedVals', tooltipFocusedVals);
        }
      }
    },

    openAgentInstallationInstructions: function() {
      this.set('showAgentInstallationModal', true);
    },

    onHideAgentInstallation: function() {
      this.set('showAgentInstallationModal', false);
    },

    openAgentReinstallInstructions: function() {
      this.set('showAgentReinstallModal', true);
    },

    onHideAgentReinstallation: function() {
      this.set('showAgentReinstallModal', false);
    },

    dismissAgentInformationNotification: function() {
      if (window.localStorage) {
        window.localStorage['agentInstallationNotificationDismissed'] = true;
      }

      this.set('agentInstallationNotificationDismissed', true);
    }
  }
});
