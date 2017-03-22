import App from '../app';
import Ember from 'ember';
import BaseController from '../controllers/base';
const { getOwner } = Ember;

export default BaseController.extend({
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,
  trackPageName: 'Notification Index',

  resetState: function (newState) {
    this.setProperties({
      paginating: false,
      sorting: false
    });

    if(newState) {
      this.setProperties(newState);
    }
  },

  hasContent: function () {
    return !this.get('error') && !!this.get('model.length');
  }.property('model' ,'error'),

  emptyState: function () {
    return !this.get('hasContent') && !this.get('error');
  }.property('model', 'error'),

  hasMoreNotifications: function () {
    let model = this.get('model');
    return !this.get('error') && model && model.meta && model.meta.pagination && model.meta.pagination.next_page;
  }.property('model' ,'error'),

  needsPagination: function () {
    let model = this.get('model');
    return !this.get('error') && model && model.meta && model.meta.pagination && model.meta.pagination.pages > 1;
  }.property('model' ,'error'),

  updateNumPendingNotifications: function(diff) {
    // Update application-level pendingNotificationsCount
    let appController = getOwner(this).lookup('controller:application');
    let pendingNotificationsCount = appController.get('pendingNotificationsCount');
    let updatedPendingNotifications = !pendingNotificationsCount ? 0 : pendingNotificationsCount + diff;
    appController.set('pendingNotificationsCount', updatedPendingNotifications);
  },

  doToggleTransition: function (notification) {
    let $body = Ember.$('#notification-' + notification.get('id') + ' .body');
    $body.css({
      height: $body[0].offsetHeight + 'px',
      transition: 'none'
    });

    let isShowing = !notification.get('isShowing');
    let newHeight = $body.find(isShowing ? '.full' : '.blurb')[0].offsetHeight;

    Ember.run.next(function () {
      window.requestAnimationFrame(function () {
        $body.toggleClass('is-showing', isShowing).css({
          height: newHeight + 'px',
          transition: ''
        });
      });
    });

    return isShowing;
  },

  actions: {
    modelLoaded: function() {
      this.resetState({
        error: false
      });
    },
    modelError: function () {
      this.resetState({
        error: true
      });
      this.trackAction('Server Error');
    },
    appendPageError: function () {
      App.NotificationsManager.show('Sorry! Something went wrong!', 'alert');
      this.trackAction('Server Pagination Error', {
        sort_by: this.get('sort'),
        direction: this.get('sort_direction'),
        page: this.get('model.meta.pagination.current_page')
      });
    },
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    toggleShow: function(notification) {
     this.doToggleTransition(notification);
     notification.set('isShowing', !notification.get('isShowing'));

      if (notification.get('isShowing') && !notification.get('acknowledged')) {
        notification.set('acknowledged', true);
        this.updateNumPendingNotifications(-1);

        notification.acknowledge().catch(() => {
          notification.set('acknowledged', false);
          this.updateNumPendingNotifications(1);
          App.NotificationsManager.show('Sorry! Something went wrong acknowledging your notification!', 'alert');
        });
      }
    }
  }
});
