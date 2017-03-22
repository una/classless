import Ember from 'ember';
import DS from 'ember-data';
import Model from 'ember-data/model';

const PRECISION = 2;

export default Model.extend({
  droplet_ids: DS.attr(),
  metric: DS.attr(),
  condition: DS.attr('string'),
  value: DS.attr('number'),
  duration: DS.attr(),
  description: DS.attr('string'),
  droplets: DS.hasMany('droplet', {async: false}),
  notification: DS.attr(),
  tags: DS.hasMany('tag', {async: false}),
  tag_ids: DS.attr(),

  selector: DS.attr(),

  name: Ember.computed.alias('description'),
  status: 'active',

  setDropletIds: function() {
    if (!this.get('isDeleted')) {
      return this.set('droplet_ids', this.get('droplets').map(d => d.get('id')));
    }
  }.observes('droplets'),

  setTagIds: function() {
    if (!this.get('isDeleted')) {
      return this.set('tag_ids', this.get('tags').map(t => t.get('name')));
    }
  }.observes('tags'),

  setSelector: function() {
    let tags = this.get('tags').map(t => t.get('name'));
    if (tags.length) {
      this.set('selector', { tags });
    }
  }.observes('tags'),

  resourceMeta: function() {
    let meta = '';

    // A lot of things can go wrong here but defaulting to empty string is OK for this computed prop.
    try {
      let metric = this.get('enumsService.metrics').find((m) => { return m.machineName === this.get('metric'); });
      let condition = this.get('enumsService.conditions').find((m) => { return m.machineName === this.get('condition'); })['name'];
      let value = -(-this.get('value'));
      value = value % 1 !== 0 ? value.toFixed(PRECISION) : value;
      let duration = this.get('enumsService.durations').findBy('id', this.get('duration.id'));

      meta = `${metric.name} ${condition} ${value}${metric.unit} for ${duration.value} ${duration.unit}`;
    } catch (e) {} // eslint-disable-line no-empty

    return meta;
  }.property('metric', 'condition', 'value', 'duration')
});
