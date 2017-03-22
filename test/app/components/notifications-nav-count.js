import Ember from 'ember';

const MAX_NOTIFICATION_COUNT = 99;

export default Ember.Component.extend({
  tagName: 'span',
  classNames: ['notification-count'],

  displayCount: function() {
    let count = this.get('pendingNotificationsCount');
    if (count > MAX_NOTIFICATION_COUNT) {
      count = '+99';
    }
    return count;
  }.property('pendingNotificationsCount')
});
