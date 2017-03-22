/* globals moment: false */
import DS from 'ember-data';

export default DS.Model.extend({
  threshold: DS.belongsTo('threshold', {async: false}),
  affectedDroplets: DS.attr(),
  dropletCount: DS.attr(),

  affectedDropletsExpanded: DS.attr('boolean', {defaultValue: false}),

  value: function() {
    return `${this.get('affectedDroplets.length')} out of ${this.get('threshold.droplets.length')} Droplets`;
  }.property('threshold', 'affectedDroplets'),

  duration: function() {
    let duration = this.get('affectedDroplets').reduce((acc, d) => {
      let startedAt = new Date(d.started_at);
      acc = acc < startedAt ? startedAt : acc;
      return acc;
    }, (new Date(0)));
    return moment(duration).fromNow(true);
  }.property('affectedDroplets')
});
