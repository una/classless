import DS from 'ember-data';
import config from '../config/environment';
import {post} from '../utils/apiHelpers';
import PollModel from '../mixins/poll-model';

const apiNS = config['api-namespace'];

export default DS.Model.extend(PollModel, {
  ip: DS.attr(),
  updatedAt: DS.attr(),
  createdAt: DS.attr(),
  region: DS.belongsTo('region'),
  droplet: DS.belongsTo('droplet'),
  latestPublicEvent: DS.belongsTo('event'),
  currentlyPendingEvent: DS.belongsTo('event'),

  pollFloatingIp: function() {
    return this.poll((floatingIp) => {
      return floatingIp.get('latestPublicEvent.isDone');
    });
  },

  pollDeletingFloatingIp: function() {
    return this.poll((floatingIp) => {
      return !floatingIp;
    });
  },

  getEventType : function (type) {
    let event = this.get('latestPublicEvent');
    if(event && event.get('type') === type) {
      return event;
    }
    return null;
  },

  assignEvent: function() {
    return this.getEventType('assign_ip');
  }.property('latestPublicEvent'),

  reserveEvent: function() {
    return this.getEventType('reserve_ip');
  }.property('latestPublicEvent'),

  releaseEvent: function() {
    return this.getEventType('release_ip');
  }.property('latestPublicEvent'),

  unassignEvent: function() {
    return this.getEventType('unassign_ip');
  }.property('latestPublicEvent'),

  name: function () {
    return this.get('ip');
  }.property('ip'),

  ipAddress: function () {
    return this.get('ip');
  }.property('ip'),

  allocateFromDroplet: function(dropletId) {
    return post(`/${apiNS}/floating_ips/allocate`, {
      floating_ip: {
        droplet_id: dropletId
      }
    });
  },

  allocateForRegion: function(regionSlug) {
    return post(`/${apiNS}/floating_ips/allocate`, {
      floating_ip: {
        region: regionSlug
      }
    });
  },

  unassign: function() {
    return this.save({adapterOptions: {operation: 'unassign'}});
  },

  reassign: function(dropletId) {
    return this.save({adapterOptions: {operation: 'reassign', data: {
      floating_ip: {
        droplet_id: dropletId
      }
    }}});
  },

  release: function(dropletId) {
    return this.save({adapterOptions: {operation: 'release', data: {
      floating_ip: {
        droplet_id: dropletId
      }
    }}});
  }
});
