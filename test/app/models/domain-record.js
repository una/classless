import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  recordType: DS.attr(), 
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  port: DS.attr(),
  weight: DS.attr(),
  ttl: DS.attr(),
  droplet: DS.belongsTo('droplet'),
  floatingIp: DS.belongsTo('floating-ip'),
  dataRecord: DS.attr(),
  priority: DS.attr()
});
