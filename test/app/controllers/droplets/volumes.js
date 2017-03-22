import Ember from 'ember';
import VolumeBaseController from '../../controllers/volume-base';
import TrackActions from '../../mixins/track-actions';
import App from '../../app';
import {RADIX} from '../../constants';

const DEFAULT_POLL_ATTACH_EVENT_RETRY = 30;

export default VolumeBaseController.extend(TrackActions, {
  trackPageName: 'Volumes Index',
  routeName: 'volumes',
  showDetached: true,
  dontTransitionAfterAttach: true,
  pollingEvents: [],
  pollingModels: {},
  POLL_FOR_NEW_EVENT_TIMEOUT: 2000,

  //segment action tracking overrides
  trackActionsOverrides : {
    resetAutoComplete: false,
    hideAutoComplete: false,
    removeAllPollingEvents: false,
    onConfirmModalHide: false,
    onResizeModalHide: false,
    hideFormatVolumeModal: false,
    onAttachComplete: false,
    showAttachAutoComplete: false,
    onResizeSizeChange: false,
    autoCompleteSelect: function (selected) {
      if(selected.type === 'default') {
        return 'Detach via AutoComplete';
      } else {
        return 'Attach via AutoComplete';
      }
    },
    menuItemClick: function (action) {
      return action + ' via the More menu';
    }
  },

  attachedMenuItems: function () {
    this.attachedMenuItems = [{name: 'Attach'}].concat(this.get('menuItems'));
  }.on('init'),

  unattachedMenuItems: function () {
    return this.get('attachedMenuItems').filter(function (item) {
      return item.name === 'Delete' || item.name === 'Resize volume' || item.name === 'Take Snapshot' || item.name === 'Attach';
    });
  }.property('attachedMenuItems'),

  pollModelUntilAttachEvent: function (volume, count = DEFAULT_POLL_ATTACH_EVENT_RETRY) {
    delete this.pollingModels[volume.id];
    volume.reload().then((volume) => {
      let event = volume.get('attachEvent');
      if(event) {
        this.pollAsyncVolumeEvent(volume, event);
      } else if(!volume.get('isUnattached')) {
        //attach event was created and finished while we were reloading
        volume.set('attachAndReattachDroplet', null);
        App.NotificationsManager.show('Volume has been attached.', 'notice');
      } else if(!--count) {
        App.NotificationsManager.show(this.DEFAULT_ERR, 'alert');
        volume.set('attachAndReattachDroplet', null);
      } else {
        this.pollingModels[volume.id] = Ember.run.later(this.pollModelUntilAttachEvent.bind(this, volume, count), this.POLL_FOR_NEW_EVENT_TIMEOUT);
      }
    });
  },

  pollAsyncVolumeEvent: function (volume, event) {
    if(event) {
      event = event.content;
      this.pollingEvents.push(event);
      event.pollEvent().then((event) => {
        this.pollingEvents.splice(this.pollingEvents.indexOf(event), 1);
        if(event.get('isAttachAndDetach')) {
          this.pollModelUntilAttachEvent(volume);
        } else {
          let onSuccess = event.get('onSuccess');
          if(onSuccess) {
            onSuccess();
          }
          volume.reload().then(function () {
            volume.set('attachAndReattachDroplet', null);
            let eventVerbs = { attach_volume: 'attached', detach_volume: 'detached', resize_volume: 'resized' };
            App.NotificationsManager.show('Volume has been ' + eventVerbs[event.get('type')] + '.', 'notice');
          });
        }
        if(volume.get('droplet.content')) {
          volume.get('droplet.content').reload();
        }
      }).catch(() => {
        let onFailure = event.get('onFailure');
        if(onFailure) {
          onFailure();
        }
        volume.reload().then(() => {
          volume.set('attachAndReattachDroplet', null);
          App.NotificationsManager.show(this.DEFAULT_ERR, 'alert');
        });

      }).finally(() => {
        this.pollingEvents.splice(this.pollingEvents.indexOf(event), 1);
      });
    }
  },

  disabledAutoCompleteItems: function () {
    let indicies = [];
    let curDropletId = this.get('autoCompleteVolume.dropletId');
    let curRegionId = this.get('autoCompleteVolume.region.id');
    let curRegionSlug = this.get('autoCompleteVolume.region.slug') || '';
    this.get('autoCompleteItems').forEach(function (model, index) {
      if(window.parseInt(model.get('id'), RADIX) === curDropletId) {
        indicies.push({ index: index, reason: 'Volume is already assigned to this Droplet'});
      } else if(model.get('region.id') !== curRegionId) {
        indicies.push({ index: index, reason:'Droplet is not located in ' + curRegionSlug.toUpperCase()});
      } else if(model.get('currentlyPendingEvent.id') ) {
        indicies.push({ index: index, reason: 'Droplet is currently processing another event'});
      }
    });
    return indicies;
  }.property('autoCompleteVolume', 'autoCompleteItems'),

  pollAsyncVolumeEvents: function () {
    this.removeAsyncVolumeEventPolling();
    this.get('volumes').forEach((volume) => {
      this.pollAsyncVolumeEvent(volume, volume.get('attachEvent') || volume.get('detachEvent') || volume.get('resizeEvent'));
    });
  }.observes('volumes'),

  removeAsyncVolumeEventPolling: function () {
    this.pollingEvents.forEach(function (event) {
      event.cancelPoll();
    });
    this.pollingEvents = [];
    for(let key in this.pollingModels) {
      if(this.pollingModels.hasOwnProperty(key)) {
          Ember.run.cancel(this.pollingModels[key]);
      }
    }
    this.pollingModels = {};
  },

  detachVolume: function (volume, deleteAfter) {
    //delete unattached volumes right away
    if(deleteAfter && volume.get('isUnattached')) {
      volume.set('deleting', true);
      volume.destroyRecord().then(function() {
        App.NotificationsManager.show('Volume has been deleted.', 'notice');
        volume.set('deleted', true);
      }).catch((err) => {
        this.errorHandler(err, 'Deleting volume');
      }).finally(function () {
        volume.set('deleting', false);
      });
    } else {
      let poll = this.pollAsyncVolumeEvent.bind(this, volume);
      volume.set('detachingDroplet', true);
      this._super(volume, volume.get('droplet.content'), deleteAfter, poll)
      .finally(function () {
        volume.set('detachingDroplet', false);
      });
    }
  },

  attachVolume: function (volume, droplet) {
    let handleFn = this._super.bind(this);
    let isDetachAndAttach = !volume.get('isUnattached');
    if(isDetachAndAttach) {
      handleFn = this.detachAndAttach.bind(this);
      volume.set('attachAndReattachDroplet', droplet);
    } else {
      volume.set('attachingDroplet', droplet);
    }
    return handleFn(volume, droplet, this.pollAsyncVolumeEvent.bind(this, volume)).then(() => {
      this.set('formatInstructionsVolume', volume);
    }).catch(function () {
      volume.set('attachAndReattachDroplet', null);
    }).finally(() => {
      volume.set('attachingDroplet', null);
    });
  },

  showAutoComplete: function (volume) {
    this.send('resetAutoComplete');
    this.set('autoCompleteVolume', volume);
  },

  actions: {

    showAttachModal: function () {
      this.send('resetAutoComplete');
      this._super();
      this.set('newVolumeName', '');
    },

    attachNewVolume: function () {
      this.attachNewVolume(this.get('selectedDroplet'));
    },

    showAttachAutoComplete: function (volume) {
      this.showAutoComplete(volume);
    },
    menuItemClick: function (action, volume) {
      if(action === 'Attach') {
        this.showAutoComplete(volume);
      } else {
        this._super(action, volume);
      }
    },
    resizeVolume: function () {
      this._super().then((volume) => {
        this.pollAsyncVolumeEvent(volume, volume.get('resizeEvent'));
      });
    },
    autoCompleteSelect: function (selected) {
      if(selected.type === 'default') {
        this.setProperties({
          modalAction: 'Detach',
          modalVolume: this.get('autoCompleteVolume')
        });
      } else {
        this.attachVolume(this.get('autoCompleteVolume'), this.set('autoCompleteVolume.attachingDroplet', selected));
      }
      this.set('autoCompleteVolume', null);
    },
    hideAutoComplete: function () {
      this.set('autoCompleteVolume', null);
    },
    removeAllPollingEvents: function () {
      this.removeAsyncVolumeEventPolling();
    }

  }

});
