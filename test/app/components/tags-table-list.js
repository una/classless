import Ember from 'ember';

export default Ember.Component.extend({
  tagClick: null,

  hasTags: Ember.computed.gt('tags.length', 0),

  hasManyTags: Ember.computed.gt('tags.length', 1),

  hiddenTagCountLabel: function() {
    return '+ ' + (this.get('tags.length') - 1);
  }.property('tags.length'),

  actions: {
    tagClick: function(tag) {
      this.sendAction('tagClick', tag);
    }
  }
});
