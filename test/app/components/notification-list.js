import Ember from 'ember';
import App from '../app';

App.NotificationsManager = Ember.Object.create({

  notifications: Ember.A(),
  pendingRemovals: [],

  show: function (message, type, link) {
    let notification = {
      message: message || '',
      type: type || '',
      link: link
    };

    this.notifications.pushObject(notification);

    return notification;
  },

  remove: function (notification) {

    // ensure that the list of current notifications is empty before hiding them, this keeps each
    // notification in the same place vertically until it is visually off of the screen
    // to disable this, just call this.notifications.removeObject(notification) instead

    this.pendingRemovals.push(notification);
    if(this.pendingRemovals.length === this.notifications.length) {

      this.pendingRemovals.forEach(function (n) {
        this.notifications.removeObject(n);
      }.bind(this));

      this.pendingRemovals = [];
    }
  }
});


App.NotificationListComponent = Ember.Component.extend({

  classNames: ['aurora-notifications'],
  tagName: 'ul',

  notifications: App.NotificationsManager.get('notifications'),

  setup: function () {
    if (typeof(ReactRailsUJS) !== 'undefined') {
      return;
    }

    let flashes = Ember.$('.flash-holder');
    let message, type;
    flashes.each((_, item) => {
      message = Ember.$(item).data('message');
      type = Ember.$(item).data('type');
      App.NotificationsManager.show(message, type);
    });
  }.on('didInsertElement')
});

export default App.NotificationListComponent;
