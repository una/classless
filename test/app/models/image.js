import App from '../app';
import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  createdAt: DS.attr('date'),
  disk: DS.attr(),
  isPublic: DS.attr(),
  isSnapshot: DS.attr(),
  isBackup: DS.attr(),
  dropletId: DS.attr('string'),
  dropletName: DS.attr('string'),
  kernel: DS.belongsTo('kernel'),
  region: DS.belongsTo('region'), /* region is the region the image is on */
  regions: DS.hasMany('region'), /* regions are the regions the image has been transferred to */
  regionIds: DS.attr(),
  requiredSettings: DS.attr(),
  distributionName: DS.attr(),
  userId: DS.attr('number'),
  ongoingTransfers: DS.hasMany('event'),
  ongoingCreate: DS.belongsTo('event'),
  currentlyPendingEvent: DS.belongsTo('event'),
  allowsPasswordReset: DS.attr('boolean'),
  billableSizeInGb: DS.attr('number'),

  longName: function () {
    let distroName = this.get('distributionName') || '';
    let name = this.get('name') || '';
    if(name.toLowerCase().indexOf(distroName.toLowerCase()) === -1) {
      name = distroName + ' ' + name;
    }

    return name;
  }.property('distributionName', 'name'),

  distributionNameClass: function () {
    return this.get('distributionName').replace(/\s/g, '-').toLowerCase();
  }.property('distributionName'),

  wasCreatedByUser: function () {
    return this.get('userId') === App.User.get('internalIdentifier') ||
      this.get('userId') === App.User.get('currentContext.internalIdentifier');
  }.property('userId'),

  getEventType : function (type) {
    let ongoingCreate = this.get('ongoingCreate');
    if(ongoingCreate && ongoingCreate.get('type') === type) {
      return ongoingCreate;
    }
    return null;
  },

  getPendingEventType : function (type) {
    let currentlyPendingEvent = this.get('currentlyPendingEvent');
    if(currentlyPendingEvent && currentlyPendingEvent.get('type') === type) {
      return currentlyPendingEvent;
    }
    return null;
  },

  restoreEvent: function() {
    return this.getPendingEventType('restore');
  }.property('currentlyPendingEvent'),

  createSnapshotEvent: function() {
    return this.getEventType('snapshot');
  }.property('ongoingCreate'),

  destroyEvent: function() {
    return this.getEventType('destroy');
  }.property('ongoingCreate'),

  createError: function () {
    return this.get('status') === 'archive';
  }.property('status'),

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
  }
});
