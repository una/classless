import Ember from 'ember';
import DS from 'ember-data';
import ENV from '../config/environment';
import {capitalize} from '../utils/stringUtils';
import {camelizeObject} from '../utils/normalizeObjects';
import { get, put } from '../utils/apiHelpers';
import {ruleKey} from '../utils/firewall-rules';
import {MAX_PROGRESS,
  COST_PER_HOUR_PRECISION,
  CURRENCY_USD_PRECISION,
  RADIX,
  STATUS_CODE_NOT_FOUND,
  STATUS_CODE_ERROR,
  STATUS_CODE_OK
} from '../constants';
import PollModel from '../mixins/poll-model';
import _ from 'lodash/lodash';

export default DS.Model.extend(PollModel, {
  name: DS.attr(),
  memory: DS.attr(),
  vcpus: DS.attr(),
  disk: DS.attr(),
  locked: DS.attr(),
  createdAt: DS.attr('date'),
  ipAddress: DS.attr(),
  acknowledgedFloatingConfig: DS.attr(),
  needsManualSetupForFloatingIp: DS.attr(),
  upgradeInstructions: DS.attr(),
  status: DS.attr(),
  server: DS.attr(),
  backupsCount: DS.attr(),
  backupsEnabled: DS.attr(),
  backupFrequency: DS.attr(),
  backupScheduleEnd: DS.attr(),
  backupScheduleStart: DS.attr(),
  canAttachOrDetachAllocation: DS.attr(),
  sizeId: DS.attr('number'),
  region: DS.belongsTo('region'),
  image: DS.belongsTo('image'),
  kernel: DS.belongsTo('kernel'),
  floatingIps: DS.hasMany('floatingIp'),
  currentlyPendingEvent: DS.belongsTo('event'),
  snapshots: DS.hasMany('image'),
  backups: DS.hasMany('image'),
  monthlyBackupPrice: DS.attr('number'),
  privateIpv4: DS.attr(),
  privateNetmask: DS.attr(),
  publicIpv4: DS.attr(),
  publicIpv4Gateway: DS.attr(),
  publicIpv4Netmask: DS.attr(),
  publicIpv6: DS.attr(),
  publicIpv6Gateway: DS.attr(),
  publicIpv6Netmask: DS.attr(),
  publicIpv6RangeStart: DS.attr(),
  publicIpv6RangeEnd: DS.attr(),
  defaultChangeKernel: DS.belongsTo('kernel'),
  adminLocked: DS.attr(),
  totalStorageSize: DS.attr('number'),
  tags: DS.attr(),
  pendingEvents: DS.attr(),
  pendingTagEvent: Ember.computed.notEmpty('pendingEvents.tags'),
  hasAgent: DS.attr('boolean'),
  securityGroups: DS.attr(),

  // This is for checking if a droplet is in a region that supports firewalls
  hasFwEnabledRegion: Ember.computed('region', function() {
    const { fwAvailableRegions } = ENV.APP;
    const slug = this.get('region.slug');
    return fwAvailableRegions['*'] || fwAvailableRegions[slug];
  }),

  metricsServiceAvailable: true,

  publicIpv6Range: function() {
    return this.get('publicIpv6RangeStart') + ' - ' + this.get('publicIpv6RangeEnd');
  }.property('publicIpv6RangeStart', 'publicIpv6RangeEnd'),

  getEventType : function (type) {
    let currentlyPendingEvent = this.get('currentlyPendingEvent');
    if(currentlyPendingEvent && currentlyPendingEvent.get('type') === type) {
      return currentlyPendingEvent;
    }
    return null;
  },

  hasFloatingIps: function () {
    let ips = this.get('floatingIps');
    return ips && ips.get('length');
  }.property('floatingIps'),

  auroraFloatingIpEvent: function() {
    let event = this.getEventType('assign_ip') || this.getEventType('unassign_ip') || this.getEventType('release_ip') || this.getEventType('reserve_ip');
    if(event && !event.get('isDone')) {
      return event;
    }
  }.property('currentlyPendingEvent'),

  /*
    For aurora to cloud floating ip page
   */
  floatingIpEvent: function() {
    let event = this.getEventType('assign-ip') || this.getEventType('unassign-ip');
    if(event && event.get('progress') !== MAX_PROGRESS) {
      return event;
    }
  }.property('currentlyPendingEvent'),

  formattedBackupPrice: function () {
    let price = this.get('monthlyBackupPrice') || 0;
    return `$${price.toFixed(CURRENCY_USD_PRECISION)}`;
  }.property('monthlyBackupPrice'),

  createEvent: function() {
    return this.getEventType('create');
  }.property('currentlyPendingEvent'),

  restoreEvent: function() {
    return this.getEventType('restore');
  }.property('currentlyPendingEvent'),

  resizeEvent: function() {
    return this.getEventType('resize');
  }.property('currentlyPendingEvent'),

  destroyEvent: function() {
    return this.getEventType('destroy');
  }.property('currentlyPendingEvent'),

  powerOnEvent: function() {
    return this.getEventType('power_on');
  }.property('currentlyPendingEvent'),

  powerOffEvent: function() {
    return this.getEventType('power_off');
  }.property('currentlyPendingEvent'),

  powerEvent: function () {
    return this.get('powerOnEvent') || this.get('powerOffEvent');
  }.property('currentlyPendingEvent'),

  passwordResetEvent: function() {
    return this.getEventType('password_reset');
  }.property('currentlyPendingEvent'),

  powerCycleEvent: function() {
    return this.getEventType('power_cycle');
  }.property('currentlyPendingEvent'),

  enablePrivateNetworkingEvent: function() {
    return this.getEventType('enable_private_networking');
  }.property('currentlyPendingEvent'),

  enablePublicIPv6NetworkingEvent: function() {
    return this.getEventType('enable_ipv6');
  }.property('currentlyPendingEvent'),

  rebuildEvent: function() {
    return this.getEventType('rebuild');
  }.property('currentlyPendingEvent'),

  renameEvent: function() {
    return this.getEventType('rename');
  }.property('currentlyPendingEvent'),

  changeKernelEvent: function() {
    return this.getEventType('change_kernel');
  }.property('currentlyPendingEvent'),

  detachEvent: function() {
    return this.getEventType('detach_volume');
  }.property('currentlyPendingEvent'),

  resizeVolumeEvent: function() {
    return this.getEventType('resize_volume');
  }.property('currentlyPendingEvent'),

  attachEvent: function() {
    return this.getEventType('attach_volume');
  }.property('currentlyPendingEvent'),

  hasBeenDestroyed: function () {
    return this.get('status') === 'archive';
  }.property('status'),

  createError: function () {
    return this.get('hasBeenDestroyed');
  }.property('hasBeenDestroyed'),

  displayStatus: function() {
    let status = this.get('status');
    if(status.length) {
      status = capitalize(status);
    }
    return status;
  }.property('status'),

  hvDisabled: function () {
    return this.get('server.offline');
  }.property('server'),

  isPoweredOff: function () {
    return this.get('status') === 'off';
  }.property('status'),

  isPoweredOn: function () {
    return this.get('status') === 'active';
  }.property('status'),

  canBeSnapshotted: function() {
    if (this.get('server.offline') || this.get('currentlyPendingEvent.id')) {
      return false;
    }

    return true;
  }.property('server.offline', 'currentlyPendingEvent.id'),

  powerOff: function () {
    return this.save({adapterOptions: {operation: 'power_off'}});
  },

  powerOn: function () {
    return this.save({adapterOptions: {operation: 'power_on'}});
  },

  powerCycle: function () {
    return this.save({adapterOptions: {operation: 'power_cycle'}});
  },

  disableBackups: function () {
    return this.save({adapterOptions: {operation: 'disable_backups'}});
  },

  enableBackups: function () {
    return this.save({adapterOptions: {operation: 'enable_backups'}});
  },

  mountRecoveryKernel: function () {
    return this.save({adapterOptions: {operation: 'mount_recovery_kernel'}});
  },

  passwordReset: function () {
    return this.save({adapterOptions: {operation: 'password_reset'}});
  },

  resize: function (size_id) {
    return this.save({adapterOptions: {operation: 'resize', data: {size_id: size_id}}});
  },

  expand: function (size_id) {
    return this.save({adapterOptions: {operation: 'expand', data: {size_id: size_id}}});
  },

  rename: function (name) {
    return this.save({adapterOptions: {operation: 'rename', data: {name: name}}});
  },

  enableInterface: function (bridge) {
    return this.save({adapterOptions: {operation: 'enable_interface', data: {bridge: bridge}}});
  },

  enableInterfaceV6: function (bridge) {
    return this.save({adapterOptions: {operation: 'enable_ipv6', data: {bridge: bridge}}});
  },

  disableInterface: function (bridge) {
    return this.save({adapterOptions: {operation: 'disable_interface', data: {bridge: bridge}}});
  },

  changeKernel: function (kernel_id) {
    return this.save({adapterOptions: {operation: 'change_kernel', data: {kernel_id: kernel_id}}});
  },

  rebuild: function (image_id) {
    return this.save({adapterOptions: {operation: 'rebuild', data: {image_id: image_id}}});
  },

  _getSizes: function (type) {
    let uri = `/${ENV['api-namespace']}/droplets/${this.get('id')}/sizes_for_${type}`;
    return get(uri).then((resp) => {
      return resp.json().then((json) => {
        return json.sizes.map(camelizeObject).map(function (size) {
          size.costPerHour = size.costPerHour.toFixed(COST_PER_HOUR_PRECISION);
          size.monthlyPrice = window.parseInt(size.monthlyPrice, RADIX);
          return size;
        });
      });
    });
  },

  getStatistics: function(type, period) {
    if (this.get('metricsAvailable')) {
      this.set('statisticsServiceStatus', STATUS_CODE_OK);
      return new Ember.RSVP.Promise((resolve) => {
        resolve([]);
      });
    }
    let uri = `/${ENV['api-namespace']}/droplets/${this.get('id')}/statistics/${type}?period=${period}`;

    return get(uri).then((resp) => {
      this.set('statisticsServiceStatus', STATUS_CODE_OK);
      return resp.json();
    }).then((json) => {
      return json.statistics;
    }).catch((response) => {
      this.set('statisticsServiceStatus', response.status);
      return [];
    });
  },

  putTags: function(tags) {
    let uri = `/${ENV['api-namespace']}/droplets/${this.get('id')}/tags`;
    return put(uri, {
      tags: tags
    }).then((resp) => {
      return resp.json();
    }).then((json) => {
      return json.tags;
    });
  },

  getHostMetrics: function() {
    let uri = `/${ENV['api-namespace']}/radar/metrics/${this.get('id')}`;
    return get(uri).then((resp) => {
      return resp.json();
    }).then((json) => {
      let metrics = json.hostmetrics;
      this.set('metricsAvailable', !!(metrics && metrics[0] && metrics[0].metrics && metrics[0].metrics.length));
      return metrics;
    }).catch((response) => {
      if (response.status === STATUS_CODE_NOT_FOUND) {
        this.set('metricsServiceAvailable', true);
        this.set('metricsAvailable', false);
        return [];
      } else if (response.status >= STATUS_CODE_ERROR) {
        this.set('metricsAvailable', false);
        this.set('metricsServiceAvailable', false);
        return response;
      } else {
        throw response;
      }
    });
  },

  getTimeSeriesStatistics: function(type, period) {
    let filteredPeriod = period === 'hour' ? '6hour' : period;
    let uri = `/${ENV['api-namespace']}/radar/metrics/${this.get('id')}/${type}?period=${filteredPeriod}`;

    return get(uri).then((resp) => {
      this.set('timeseriesServiceStatus', STATUS_CODE_OK);
      return resp.json();
    }).then((json) => {
      return json.stat;
    }).catch((response) => {
      this.set('timeseriesServiceStatus', response.status);
      return [];
    });
  },

  getSizesForResize: function() {
    return this._getSizes('resize');
  },

  getSizesForExpand: function () {
    return this._getSizes('expand');
  },

  allSecurityGroupsRules: function() {
    const groups = this.get('securityGroups');
    const allRules = (type) => (
      _.chain(groups.toArray())
        .map(group => group.get(type))
        .flatten()
        .uniq(ruleKey)
        .value()
    );
    return {
      inbound: allRules('inbound'),
      outbound: allRules('outbound')
    };
  }.property('securityGroups'),

  /**
   * triggerEvent - post to model creates event
   * @param  {string} event_type - name of trigger event
   * @param  {object} data - data to include in post
   * @return {object} event response
   */
  triggerEvent: function (event_type, data) {
    return this.save({
      adapterOptions: {
        operation: event_type,
        data: data
      }
    });
  },

  pollDroplet: function () {
    return this.poll((droplet) => {
      return !droplet.get('pendingTagEvent');
    });
  }
});
