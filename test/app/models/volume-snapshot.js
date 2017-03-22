import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  createdAt: DS.attr(),
  region: DS.attr(),
  volumeName: DS.attr(),
  volumeId: DS.attr(),
  description: DS.attr(),
  sizeGigabytes: DS.attr(),
  utilizedSizeGigabytes: DS.attr(),
  sizeBytesCalculated: DS.attr(),

  restore: function (dropletId, region, size, name) {
    return this.save({adapterOptions: {operation: 'restore', data: {
      droplet_id: dropletId,
      region: region,
      size_gigabytes: size,
      name: name
    }}});
  }
});
