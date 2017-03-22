import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  content: DS.attr(),
  key: DS.attr(),
  createdAt: DS.attr(),
  fingerprint: DS.attr()
});
