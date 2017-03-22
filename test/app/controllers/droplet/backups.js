import Ember from 'ember';
import App from '../../app';
import BackupsController from '../images/backups';

export default BackupsController.extend({
  trackPageName: 'Droplet Show Backups',
  dropletCtrl: Ember.inject.controller('droplet'),
  isDropletShow: true,

  sendBackupEvent: function (event, successVerb) {
    let droplet = this.get('droplet');
    this.set('togglingBackups', true);
    droplet[event]().then(() => {
      return App.NotificationsManager.show('Backups ' + successVerb, 'notice');
    }).catch((err) => {
      this.errorHandler(err, 'Toggling Backups');
    }).finally(() => {
      this.set('togglingBackups', false);
    });
  },

  actions: {
    disableBackups: function() {
      this.sendBackupEvent('disableBackups', 'Disabled');
    },

    enableBackups: function () {
      this.sendBackupEvent('enableBackups', 'Enabled');
    }
  }
});
