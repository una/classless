import Ember from 'ember';
import App from '../../app';
import BaseController from '../../controllers/base';
import {
  MAX_PERCENTS,
  METRICS_PRECISION
} from '../../constants';

const DEFAULT_THRESHOLD_VALUE = 70;
const DEFAULT_THRESHOLD_MULTIPLIER = 0.7;
const COLOR_PALETTE = [ '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4', '#1E77B4' ];
const MONTH_OF_SECONDS = 30 * 24 * 3600; // eslint-disable-line no-magic-numbers

let CheckBoxViewModel = Ember.Object.extend({
  value: null,
  checked: false,

  editingValue: false,

  checkBoxDisabled: function() {
    return this.get('editingValue') || !this.get('value');
  }.property('value', 'editingValue'),

  endpointURIPrefix: '',
  formatEndpointURI() {
    return this.get('value') && this.get('checked') ? this.get('endpointURIPrefix') : null;
  }
});

export default BaseController.extend({
  init: function() {
    this._super(...arguments);

    this.set('validateMonitorName', Ember.run.bind(this, function() {

      let sameNameAlert = this.store.peekAll('threshold').find((a) => {
        if (a === this.get('model.editedAlert')) {
          return false;
        }
        return this.get('monitorName') && (a.get('Name') === this.get('monitorName'));
      });

      return !sameNameAlert;
    }));

    this.set('metricAutoCompleteItems', this.get('enumsService.metrics'));

    this.set('metricsValuesMap', Ember.Object.create(this.get('enumsService.metrics').reduce((acc, m) => {
      acc[m.machineName] = {
        value: 0,
        isUserEntered: false
      };

      return acc;
    }, {})));
  },

  initCheckboxes: function() {
    if (this.get('model.endpoints.length')) {
      this.get('model.endpoints').forEach((epConf) => {
        this.set(epConf.name, CheckBoxViewModel.create({
          endpointURIPrefix: epConf.uriPrefix,
          value: '',
          checked: false
        }));
      });
    }


    let slackInfo = this.get('slackIdentity');
    if (slackInfo) {
      this.set('slack.value', slackInfo.get('webhookUrl'));
      this.set('slack.channel', slackInfo.get('channel'));
      this.set('slack.checked', false);
    }

    let editing = this.get('model.threshold');

    if (editing) {
      if (this.get('model.threshold.notification.slack.webhook_url')) {
        this.set('slack.value', this.get('model.threshold.notification.slack.webhook_url'));
        this.set('slack.channel', this.get('model.threshold.notification.slack.channel'));
        this.set('slack.checked', true);
      }

      if (this.get('model.threshold.notification.email')) {
        this.set('email.address', this.get('model.threshold.notification.email'));
        this.set('email.checked', true);
      } else {
        this.set('email.address', App.User.get('email'));
      }
    } else {
      if (slackInfo) {
        this.set('slack.checked', true);
      }

      this.set('email.checked', true);
      this.set('email.address', App.User.get('email'));
    }

  }.observes('model.endpoints.length', 'model.socialIdentities.@each'),

  resetForm: function() {
    let enumsService = this.get('enumsService');

    this.setProperties({
      selectedMetric: enumsService.get('metrics')[0],
      selectedDroplet: this.store.peekAll('droplet').get('firstObject'),
      conditionChoice: enumsService.get('conditions')[0].machineName,
      thresholdValue: 70,
      durationChoice: enumsService.get('durations')[0],
      description: this.get('monitorNameExample'),
      userEnteredDescription: false
    });

    this.set('selectedDropletsList', Ember.A());
  },

  populateForm: function() {
    this.resetForm();

    let threshold = this.get('model.threshold');

    if (!threshold) {
      this.get('selectedDropletsList').addObject(Ember.Object.create({
        droplet: this.store.peekAll('droplet').get('firstObject'),
        metrics: {}
      }));

      return;
    }

    let enumsService = this.get('enumsService');
    let durationChoice = enumsService.get('durations').findBy('id', threshold.get('duration.id')) ||
      enumsService.get('durations.firstObject');
    let selectedMetric = enumsService.get('metrics').findBy('machineName', threshold.get('metric'));
    this.set(`metricsValuesMap.${selectedMetric.machineName}.isUserEntered`, true);
    this.set(`metricsValuesMap.${selectedMetric.machineName}.value`, threshold.get('value').toFixed(METRICS_PRECISION));
    let selectedDropletsItems = this.get('selectedDropletsList');

    selectedDropletsItems
      .pushObjects(threshold.get('tags').map((tag) => {
        return Ember.Object.create({
          tag: tag
        });
      }))

    selectedDropletsItems
      .pushObjects(threshold.get('droplets').map((droplet) => {
        return Ember.Object.create({
          droplet: droplet,
          metrics: {}
        });
      }));

    this.setProperties({
      selectedMetric: selectedMetric,
      conditionChoice: threshold.get('condition'),
      thresholdValue: threshold.get('value').toFixed(METRICS_PRECISION),
      durationChoice: durationChoice,
      description: threshold.get('description'),
      userEnteredDescription: true,
      selectedDroplet: selectedDropletsItems.get('lastObject.droplet')
    });

    this.set('selectedDropletsList', Ember.A(selectedDropletsItems));

  }.observes('model'),

  dropletsDisabledModelIndices: function () {
    let indices = [];
    return indices;
  }.property('autoCompleteItems'),

  updateMetricsValuesMap: function() {
    let data = this.get('dropletChartData');

    if (!data || !data.length) { return; }

    let metric = this.get('selectedMetric');
    let metricValueMap = this.get(`metricsValuesMap.${metric.machineName}`);
    let values = [MAX_PERCENTS];

    if (!metricValueMap.isUserEntered) {
      if (metric.unit !== '%') {
        values = data.reduce((acc, d) => {
          if (d.data) {
            Array.prototype.push.apply(acc, d.data.map(v => v.value));
          }
          return acc;
        }, [0]);
      }

      this.set(`metricsValuesMap.${metric.machineName}.value`,
          (Math.max(...values) * DEFAULT_THRESHOLD_MULTIPLIER).toFixed(METRICS_PRECISION));
    }
  },

  updateThresholdValue: function() {
    let metric = this.get('selectedMetric');
    this.set('thresholdValue', this.get(`metricsValuesMap.${metric.machineName}.value`));
  },

  resetMetricsValuesMap: function() {
    this.get('enumsService.metrics').forEach((m) => {
      this.set(`metricsValuesMap.${m.machineName}.isUserEntered`, false);
    });
  },

  enumsService: Ember.inject.service('insights-threshold-enums'),
  combinedDropletMetrics: Ember.inject.service('combined-droplet-metrics'),

  selectedDropletsList: Ember.A(),

  colorPalette: COLOR_PALETTE,
  thresholdValue: DEFAULT_THRESHOLD_VALUE,
  durationChoice: null,
  validateMonitorName: Ember.K,
  selectedDroplet: null,
  description: null,
  dropletChartData: [],
  chartHeader: '',
  chartMaxY: 0,
  monthOfSeconds: MONTH_OF_SECONDS,

  modalTitle: 'Create monitor',

  tooltipContent: Ember.Object.create({
    isVisible: false,
    date: '',
    time: '',
    dropletname: '',
    value: '',
    unit: ''
  }),

  searchResults: Ember.A(),

  monitorNameExample: function() {
    if (this.get('model.threshold')) {
      return this.get('model.threshold.description');
    } else {
      let selectedMetric = this.get('selectedMetric') || this.get('enumsService.metrics')[0];
      let highLow = this.get('conditionChoice') === 'ABOVE' ? 'high' : 'low';

      return `${selectedMetric.name} is running ${highLow}`;
    }
  }.property('conditionChoice', 'selectedMetric', 'selectedDroplet'),

  updateChartHeader: function() {
    if (this.get('selectedMetric.name')) {
      this.set('chartHeader', `${this.get('selectedMetric.name')} last 30 days`);
    }
  }.observes('selectedMetric'),

  updateDescription: function() {
    if (!this.get('userEnteredDescription')) {
      this.set('description', this.get('monitorNameExample'));
    }
  }.observes('conditionChoice', 'selectedMetric', 'selectedDroplet'),

  monitorNameErrorMsg: function() {
    if (this.get('monitorName')) {
      return 'This Monitor Name already exists, try another';
    } else {
      return 'Monitor name cannot be blank';
    }
  }.property('monitorName'),

  thresholdMax: function() {
    if (this.get('selectedMetric.unit') === '%') {
      return 100; // eslint-disable-line no-magic-numbers
    }
    return Number.MAX_VALUE;
  }.property('selectedMetric'),

  formToThreshold: function() {
    return {
      droplets: this.get('selectedDropletsList').reduce((acc, item) => {
        if (item.get('droplet')) {
          acc.push(item.get('droplet'));
        }
        return acc;
      }, []),

      tags: this.get('selectedDropletsList').reduce((acc, item) => {
        if (item.get('tag')) {
          acc.push(item.get('tag'));
        }
        return acc;
      }, []),

      metric: this.get('selectedMetric.machineName'),
      condition: this.get('conditionChoice'),
      value: this.get('thresholdValue'),
      duration: {unit: this.get('durationChoice.machineName'), value: this.get('durationChoice.value'), id: this.get('durationChoice.id')},
      description: this.get('description'),
      notification: {
        email: this.get('email.checked') ? this.get('email.address'): '',
        slack: {
          webhook_url: this.get('slack.checked') && this.get('slack.value') ? this.get('slack.value') : '',
          channel: this.get('slack.checked') && this.get('slack.channel') ? this.get('slack.channel') : ''
        }
      }
    };
  },

  updateSlackCheckbox: function() {
    let slackIdentity = null;

    if (this.get('model.socialIdentities')) {
      slackIdentity = this.get('model.socialIdentities').findBy('type', 'slack');
    }

    // This line was added for testing
    if (!this.get('slack')) {
      this.set('slack', {});
    }

    if (slackIdentity) {
      this.set('slackIdentity', slackIdentity);
      this.set('slack.value', slackIdentity.get('webhookUrl'));
      this.set('slack.channel', slackIdentity.get('channel'));
      this.set('slack.checked', true);
    } else {
      this.set('slack.value', null);
      this.set('slack.channel', null);
      this.set('slack.checked', false);
    }
  }.observes('model.socialIdentities.@each'),

  canCreate: function() {
    return this.get('description') &&
    this.get('selectedDropletsList.length') &&
    this.get('selectedMetric') &&
    this.get('hasAtLeastOneAlert');
  }.property('selectedDropletsList.length', 'selectedMetric', 'slack.checked', 'email.checked', 'description'),

  hasAtLeastOneAlert: function() {
    return ((this.get('slack.checked') === true) || (this.get('email.checked') === true));
  }.property('slack.checked', 'email.checked'),

  selectedDroplets: function() {
    return this.get('selectedDropletsList').map(item => item.droplet);
  }.property('selectedDropletsList.@each'),

  actions: {
    selectCondition: function(option) {
      this.set('conditionChoice', option);
    },

    selectDuration: function(option) {
      this.set('durationChoice', this.get('enumsService.durations').findBy('id', option));
    },

    onUnselectDroplet: Ember.K,
    onSelectDroplet: function(selected) {
      if (!this.get('selectedDropletsList').findBy('droplet.id', selected.get('id'))) {

        this.get('selectedDropletsList').addObject(Ember.Object.create({
          droplet: selected,
          metrics: {},
          highlighted: false
        }));
      }
    },

    onUnselectMetric: Ember.K,
    onSelectMetric: function(selected) {
      this.set('selectedMetric', selected);
    },

    removeFromSelectedDropletsList: function(dropletId) {
      let dropletList = this.get('selectedDropletsList');
      let objToRemove = dropletList.findBy('droplet.id', dropletId);
      dropletList.removeObject(objToRemove);

      if (!dropletList.get('length')) {
        this.resetMetricsValuesMap();
      }
    },

    createMonitor: function() {
      this.set('isSaving', true);
      let monitor = this.store.createRecord('threshold', this.formToThreshold());
      monitor.setDropletIds();

      monitor.save()
        .catch(() => {
          App.NotificationsManager.show(`Could not create monitor, please try again later.`, 'alert');
        })
        .finally(() => {
          this.transitionToRoute('monitors.index');
          this.set('isSaving', false);
        });
    },

    updateMonitor: function() {
      this.set('isSaving', true);
      let monitor = this.store.peekRecord('threshold', this.get('model.threshold.id'));
      monitor.setProperties(this.formToThreshold());
      monitor.setDropletIds();

      monitor.save()
        .catch(() => {
          App.NotificationsManager.show(`Could not save monitor, please try again later.`, 'alert');
        })
        .finally(() => {
          this.transitionToRoute('monitors.index');
          this.set('isSaving', false);
        });
    },

    updateMonitorDescription: function(val) {
      this.set('userEnteredDescription', true);
      this.set('description', val);
    },

    authenticateSlack: function() {
      this.send('authenticate', 'slack-proxy');
    },

    deleteSlack: function() {
      let slackIdentity = this.get('slackIdentity');
      if (slackIdentity) {
        slackIdentity.deleteRecord();
        slackIdentity.save();
        this.set('slackIdentity', null);
      }

      this.set('slack.value', null);
      this.set('slack.checked', false);

      if (this.get('model.threshold.notification.slack.webhook_url')) {
          this.set('model.threshold.notification.slack.webhook_url', null);
          this.set('model.threshold.notification.slack.channel', null);
      }
    },

    autocompleteSearchMetrics: function(val) {
      this.set('metricAutoCompleteItems', this.get('enumsService.metrics').filter((m) => {
        return m.name.toLowerCase().indexOf(val.toLowerCase()) !== -1;
      }));
    },

    trackThresholdUserInput: function() {
      let metric = this.get('selectedMetric');
      this.set(`metricsValuesMap.${metric.machineName}.isUserEntered`, true);
      this.set(`metricsValuesMap.${metric.machineName}.value`, this.get('thresholdValue'));
    },

    querySelectedResourses: function(query) {
      Ember.RSVP.all([
        this.get('store').query('tag', { query: query }),
        this.get('store').query('droplet', { query: query })
      ])
      .then((results) => {
        this.set('searchResults', results[0].pushObjects(results[1].content));
      });
    }
  }
});
