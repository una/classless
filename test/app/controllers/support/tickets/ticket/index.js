import Ember from 'ember';

export default Ember.Controller.extend({
  collapsedReplies: function () {
    return this.get('model.replies').filter(record => {
      return record.get('alwaysOpen') !== true;
    });
  }.property('model.replies'),

  expandedReplies: function() {
    return this.get('model.replies').filter(record => {
      return record.get('alwaysOpen') === true;
    });
  }.property('model.replies')
});
