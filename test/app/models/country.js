import DS from 'ember-data';

export default DS.Model.extend({
  iso: DS.attr(),
  name: DS.attr()
});
