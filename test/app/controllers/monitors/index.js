import Ember from 'ember';
import BaseController from '../../controllers/base';
import App from '../../app';

export default BaseController.extend({
  trackPageName: 'Monitors',

  graphsCtrl: Ember.inject.controller('droplet/graphs'),
  disabledDropletText: 'Update Droplet for Monitoring',
  newMonitorLink: App.featureEnabled('newMonitorCreate') ? 'monitors.new' : 'monitors.add',

  actions: {
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    showDropletUpdateDialog: function() {
      Ember.run.next(() => {
        this.get('graphsCtrl').send('openAgentInstallationInstructions');
      });
    },
    expandAffectedDroplets: function(activeAlert) {
      activeAlert.set('affectedDropletsExpanded', !activeAlert.get('affectedDropletsExpanded'));
    }
  }
});
