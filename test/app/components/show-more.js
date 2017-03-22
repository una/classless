import Ember from 'ember';

export default Ember.Component.extend({
  classNames: 'aurora-show-more',
  click: function() {
    this.sendAction('action', this.get('actionParam'));
  },
  text: function () {
    return this.get('showMoreText') || 'Show More';
  }.property('showMoreText')
});
