import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  inbound: DS.attr(),
  outbound: DS.attr(),
  targets: DS.hasMany('droplet'),
  tags: DS.hasMany('security-group-tag'),
  createdAt: DS.attr(),

  createdAtISO: function() {
    return new Date(
      this.get('createdAt.seconds') * 1000  // eslint-disable-line no-magic-numbers
    ).toISOString();
  }.property('createdAt.seconds'),

  ruleCount: Ember.computed('inbound', 'outbound', function() {
    return this.get('inbound.length') + this.get('outbound.length');
  }),

  dropletCount: Ember.computed('targets', 'tags', function() {
    let count = this.get('targets.length');
    this.get('tags').forEach((tag) => {
      count += Ember.get(tag, 'droplets.length');
    });
    return count;
  })
});
