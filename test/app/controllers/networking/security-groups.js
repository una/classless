import App from '../../app';
import Ember from 'ember';
import BaseController from '../base';

export default BaseController.extend({
  serviceStatus: function() {
    return this.get('model.serviceStatus');
  }.property('model.serviceStatus'),

  securityGroups: function() {
    return this.get('model.securityGroups');
  }.property('model.securityGroups'),

  menuItems: Ember.A([{name: 'Destroy'}]),

  actions: {
    menuItemClick: function(clicked, securityGroup) {
      if (clicked === 'Destroy') {
        securityGroup.destroyRecord().then(() => {
          App.NotificationsManager.show(securityGroup.get('name') + ' has been deleted.', 'notice');
        });
      }
    }
  }
});
