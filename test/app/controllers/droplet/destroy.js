import Ember from 'ember';
import App from '../../app';
import AutoCompleteController from '../../controllers/autocomplete';

export default AutoCompleteController.extend({
  trackPageName: 'Droplet Show Destroy',
  dropletCtrl: Ember.inject.controller('droplet'),

  showConfirmDestroyModal: false,
  selectedDistro: null,
  hasAttachedVolumes: Ember.computed.gt('droplet.totalStorageSize', 0),

  isRebuildButtonDisabled: function() {
    return this.get('dropletCtrl.isBusy') ||
           this.get('isRebuildingDroplet') ||
           this.get('isDestroyingDroplet') ||
           this.get('dropletCtrl.model.rebuildEvent') ||
           this.get('selectedDistro') === null;
  }.property('dropletCtrl.isBusy', 'isRebuildingDroplet', 'isDestroyingDroplet', 'dropletCtrl.model.rebuildEvent', 'selectedDistro'),

  rebuild: function () {
    this.set('isRebuildingDroplet', true);
    this.get('droplet').rebuild(this.get('selectedDistro.id')).catch((err) => {
      this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.rebuild').action);
    }).finally(() => {
      this.set('isRebuildingDroplet', false);
    });
  },

  actions: {
    destroyDroplet: function() {
      this.set('showConfirmDestroyModal', true);
    },
    onConfirmDestroy: function(result) {
      this.set('showConfirmDestroyModal', false);

      if(result) {
        this.set('isDestroyingDroplet', true);
        this.get('dropletCtrl.model').destroyRecord().then(() => {
          App.NotificationsManager.show('Droplet has been destroyed.', 'notice');
          this.transitionToRoute('droplets');
        }).catch((err) => {
          this.errorHandler(err, 'Destroy Droplet');
        }).finally(() => {
          this.set('isDestroyingDroplet', false);
        });
      }
    },
    onSelectDistro: function(selected) {
      this.set('selectedDistro', selected);
    },
    onUnselectDistro: function() {
      this.set('selectedDistro', null);
    },
    rebuild: function() {
      this.set('showRebuildConfirm', true);
    },
    onConfirmRebuild: function (result) {
      this.set('showRebuildConfirm', false);
      if(result) {
        this.rebuild();
      }
    }
  }
});
