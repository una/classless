import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  droplets: DS.hasMany('droplet'),

  count: Ember.computed.alias('droplets.length')
});
