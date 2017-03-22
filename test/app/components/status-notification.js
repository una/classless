import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['aurora-status-notification'],
  isExpanded: false,

  filteredNotifications: function() {
    let notifications = this.get('notifications');
    let validNotifications = [];

    if(notifications) {
      notifications.forEach(function(notification) {
        if(!notification.get('wasAcknowledged') && !notification.get('acknowledged')) {
          validNotifications.push(notification);
        }
      });
    }

    return validNotifications;
  }.property('notifications', 'notifications.@each.acknowledged'),

  actions: {
    close: function(notification) {
      notification.acknowledge();
      notification.set('acknowledged', true);
    },
    toggle: function(isExpanding, id) {
      this.set('isExpanded', isExpanding);
      let $update = Ember.$('.status-notification-update-' + id);

      if(!isExpanding) {
        $update.height(0);
      } else {
        if($update.length) {
          let $wrapper = $update.find('.status-notification-updates-wrapper');
          if($wrapper.length) {
            let height = $wrapper[0].offsetHeight;
            $update.height(height);
          }
        }
      }
    }
  }
});
