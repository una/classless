import Ember from 'ember';

export default Ember.Component.extend({
  tagName: '',
  upperSlug: function () {
    return (this.get('slug') || '').toUpperCase();
  }.property('slug')
});
