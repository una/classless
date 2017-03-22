import DS from 'ember-data';

export default DS.Model.extend({
  dropletId: DS.attr(),
  ipAddress: DS.attr(),
  name: DS.attr()
});
