import Ember from 'ember';
import DS from 'ember-data';
import ENV from '../config/environment';
import { get } from '../utils/apiHelpers';

export default DS.Model.extend({
  name: DS.attr('string'),
  region: DS.attr('string'),
  ip: DS.attr(),
  targetDroplets: DS.attr(),
  tag: DS.attr(),
  backendDropletCount: Ember.computed.alias('targetDroplets.length'),
  createdAt: DS.attr(),
  algorithm: DS.attr(),
  forwardingRules: DS.attr(),
  healthCheck: DS.attr(),
  stickySessions: DS.attr(),
  redirectHttpToHttps: DS.attr(),
  state: DS.attr(),
  metrics: DS.attr(),
  isCreating: DS.attr('boolean', { defaultValue: false }),
  justCreated: DS.attr('boolean', { defaultValue: false }),

  reqPerSec: Ember.computed.alias('metrics.reqPerSec'),
  status: Ember.computed.alias('metrics.status'),
  dropletCount: Ember.computed.alias('metrics.dropletCount'),
  healthyDropletCount: Ember.computed.alias('metrics.healthyDropletCount'),

  stateChanged: Ember.on('init', Ember.observer('state', function() {
    if (this.get('state') === 'NEW') {
      this.set('isCreating', true);
    }
  })),

  createdAtMs: Ember.computed('createdAt.seconds', function() {
    return this.get('createdAt.seconds') * 1000; // eslint-disable-line no-magic-numbers
  }),

  createdAtISO: Ember.computed('createdAtMs', function() {
    return new Date(this.get('createdAtMs')).toISOString();
  }),

  getTimeSeriesStatistics: function(type, period) {
    const filteredPeriod = period === 'hour' ? '6hour' : period;
    const uri = `/${ENV['api-namespace']}/load_balancers/${this.get('id')}/metrics/${type}?period=${filteredPeriod}`;

    return get(uri).then((resp) => {
      return resp.json();
    }).then((json) => {
      return json.stat;
    }).catch(function () {
      return [];
    });
  }
});
