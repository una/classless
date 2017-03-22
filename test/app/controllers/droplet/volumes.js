import Ember from 'ember';
import TrackActions from '../../mixins/track-actions';
import VolumeBaseController from '../volume-base';
import App from '../../app';

export default VolumeBaseController.extend(TrackActions, {
  // Base Controller Properties
  trackPageName: 'Droplet Show Volumes',
  routeName: 'droplet.volumes',

  // Query Params
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,

  // Injected Services
  dropletCtrl: Ember.inject.controller('droplet'),

  // TrackActions Configs
  trackActionsOverrides : {
    onConfirmModalHide: false,
    hideFormatVolumeModal: false,
    onResizeModalHide: false,
    onSizeChange: false,
    changeStorageTab: false,
    selectVolume: false,
    onResizeSizeChange: false
  },

  // Controller Props
  longMsg: true,
  dropletFromModel: true,
  needToUpdateUnattached: true,
  instructionsTooltip: 'Heads up! If you need these instructions again, you can find them in here.',

  dropletName: function () {
    return this.get('dropletCtrl.model.name');
  }.property('dropletCtrl.model.name'),

  dropletCannotAddVolumes: function() {
    return !this.get('dropletCtrl.model.canAttachOrDetachAllocation');
  }.property('dropletCtrl.model.canAttachOrDetachAllocation'),

  dropletIsTogglingPower: function() {
    return !!this.get('dropletCtrl.model.powerCycleEvent');
  }.property('dropletCtrl.model.powerCycleEvent'),

  volumeRegionSlug: function () {
    return this.get('dropletCtrl.model.region.slug');
  }.property('dropletCtrl.model.region.slug'),

  isDisabled: function () {
    return this.get('detachingVolume') || this.get('attachingVolume') || this.get('showAttachModal') || this.get('pendingVolume') || this.get('dropletCtrl.isBusy') || this.get('isResizing') || this.get('dropletCannotAddVolumes');
  }.property('detachingVolume', 'attachingVolume', 'pendingVolume', 'showAttachModal', 'dropletCtrl.isBusy', 'isResizing', 'dropletCanAddVolumes'),

  dropletDropdownList: function () {
    return [this.getModalDroplet()];
  }.property('dropletCtrl.model'),

  selectedDroplet: function () {
    return this.getModalDroplet();
  }.property('dropletCtrl.model'),

  detachVolume: function (volume, deleteAfter) {
    let droplet = this.get('dropletCtrl.model');
    this._super(volume, droplet, deleteAfter, (event) => {
      droplet.reload().then(() => {
        //if event is already done, clean up and show the successMessage
        if(!droplet.get('detachEvent')) {
          this.set('detachingVolume', null);
          volume.set('pendingEvent', null);
          let onSuccess = event.get('onSuccess');
          if(onSuccess) {
            onSuccess();
          }
          App.NotificationsManager.show('Volume has been ' + (deleteAfter ? 'deleted.' : 'detached.'), 'notice');
        }
      });
    });
  },

  attachVolume: function (volume) {
    let droplet = this.get('dropletCtrl.model');
    return this._super(volume, droplet, () => {
      droplet.reload().then(() => {
        //if event is already done, clean up and show the successMessage
        if(!droplet.get('attachEvent')) {
          this.set('pendingVolume', null);
          volume.set('pendingEvent', null);
          App.NotificationsManager.show('Volume has been attached.', 'notice');
        }
      });
    });
  },

  setEventsAsDetaching: function () {
    this.get('volumes').map((volume) => {
      if(volume.get('detachEvent')) {
         this.set('detachingVolume', volume);
         volume.set('detached', true);
      }
      return volume;
    });
  }.observes('volumes'),

  getModalDroplet: function () {
    return this.get('dropletCtrl.model');
  },

  actions: {

    attachNewVolume: function () {
      this.attachNewVolume(this.get('dropletCtrl.model'));
    },

    onAttachComplete: function (volume) {
      volume.set('pendingEvent', null);
    },

    resizeVolume: function () {
      let droplet = this.get('dropletCtrl.model');
      this.set('isResizing', true);
      this._super().then((volume) => {
        volume.set('resizing', true);
        droplet.reload().then(() => {
          //if event is already done, clean up and show the successMessage
          let event = droplet.get('resizeVolumeEvent');
          if(!event) {
            volume.set('pendingEvent', null);
            App.NotificationsManager.show('Volume has been resized.', 'notice');
          } else {
            event.set('onFailure', function () {
              volume.reload();
            });
          }
        }).finally(() => {
          volume.set('resizing', false);
          this.set('isResizing', false);
        });
      }).catch(() => {
        this.set('isResizing', false);
      });
    },
    attachExistingVolume: function () {
      this.set('attachingVolume', true);
      let volume = this.get('selectedVolume');
      this.attachVolume(volume).then(() => {
        this.updateUnattachedVolumes();
        this.afterAttach(volume, false);
      }).finally(() => {
        this.set('attachingVolume', false);
      });
    },
    powerCycleDroplet: function() {
      let droplet = this.get('dropletCtrl.model');
      this.set('clickedCycleButton', true);
      droplet.powerCycle().catch((err) => {
        this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.power_cycle').action);
      }).finally(() =>{
        this.set('clickedCycleButton', false);
      });
    }

  }
});
