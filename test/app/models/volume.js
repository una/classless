import DS from 'ember-data';

export default DS.Model.extend({
  description: DS.attr(),
  name: DS.attr(),
  dropletIds: DS.attr(),
  highlightNew: DS.attr(),
  createdAt: DS.attr('date'),
  region: DS.belongsTo('region'),
  regionSlug: DS.attr(), //used for creating new volumes
  sizeGigabytes: DS.attr(),
  pendingEvent: DS.belongsTo('event'),
  droplet: DS.belongsTo('droplet'),

  getEventType: function (type) {
    let pendingEvent = this.get('pendingEvent');
    if(pendingEvent && pendingEvent.get('type') === type) {
      return pendingEvent;
    }
    return null;
  },

  resizeMin: function () {
    return this.get('sizeGigabytes') + 1;
  }.property('sizeGigabytes'),

  dropletId: function () {
    if(this.get('dropletIds.length')) {
      return this.get('dropletIds')[0];
    }
    return null;
  }.property('dropletIds'),

  isUnattached: function () {
    return this.get('dropletId') === null;
  }.property('dropletId'),

  detachEvent: function() {
    return this.getEventType('detach_volume');
  }.property('pendingEvent'),

  attachEvent: function() {
    return this.getEventType('attach_volume');
  }.property('pendingEvent'),

  resizeEvent: function() {
    return this.getEventType('resize_volume');
  }.property('pendingEvent'),

  detachFromDroplet: function(dropletId, deleteAfter, attachToNewDropletId) {
    let data = {
      delete_after_detaching: deleteAfter,
      droplet_id: dropletId
    };
    if(attachToNewDropletId) {
      data.attach_droplet_id = attachToNewDropletId;
    }
    return this.save({
      adapterOptions: {
        operation: 'detach',
        data: data
      }
    });
  },
  attachToDroplet: function(dropletId) {
    return this.save({
      adapterOptions: {
        operation: 'attach',
        data: {
          droplet_id: dropletId
        }
      }
    });
  },
  resize: function(size) {
    return this.save({
      adapterOptions: {
        operation: 'update',
        data: {
          size_gigabytes: size
        }
      }
    });
  }
});
