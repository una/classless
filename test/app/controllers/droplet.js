import Ember from 'ember';
import App from '../app';
import BaseController from '../controllers/base';
import _ from 'lodash/lodash';
import {CONSOLE_WINDOW_WIDTH, CONSOLE_WINDOW_HEIGHT} from '../constants';

const NOTIFICATION_DELAY = 250;

export default BaseController.extend({
  storageRegions: ['nyc1', 'stage1'],

  dropletActionHash: [
    { action_name: 'droplet.graphs', title: 'Graphs' },
    { action_name: 'droplet.access', title: 'Access' },
    { action_name: 'droplet.power', title: 'Power' },
    { action_name: 'droplet.volumes', title: 'Volumes', betaNew: true },
    { action_name: 'droplet.resize', title: 'Resize' },
    { action_name: 'droplet.networking', title: 'Networking' },
    { action_name: 'droplet.backups', title: 'Backups' },
    { action_name: 'droplet.snapshots', title: 'Snapshots' },
    { action_name: 'droplet.kernel', title: 'Kernel' },
    { action_name: 'droplet.history', title: 'History' },
    { action_name: 'droplet.destroy', title: 'Destroy' },
    { action_name: 'droplet.tags', title: 'Tags' }
  ],

  eventMessageHash: {
    'password_reset': {
      successMessage: 'Root password has been reset and emailed to you.',
      action: 'Resetting root password'
    },
    'power_off': {
      action: 'Power off',
      hideLoader: true
    },
    'power_on': {
      action: 'Power on',
      hideLoader: true
    },
    'power_cycle': {
      successMessage: 'Droplet has been power cycled.',
      action: 'Cycling power'
    },
    'enable_private_networking': {
      successMessage: 'Private networking has been enabled.',
      action: 'Enabling private networking'
    },
    'enable_ipv6': {
      successMessage: 'Public IPv6 networking has been enabled.',
      action: 'Enabling public IPv6 networking'
    },
    'change_kernel': {
      successMessage: 'Droplet\'s kernel has been changed.',
      action: 'Changing kernel'
    },
    'rebuild': {
      successMessage: 'Droplet has been rebuilt.',
      action: 'Rebuilding droplet'
    },
    'rename': {
      successMessage: 'Droplet has been renamed.',
      action: 'Droplet rename',
      hideLoader: true
    },
    'restore': {
      successMessage: 'Droplet has been restored.',
      action: 'Restoring droplet'
    },
    'snapshot': {
      successMessage: 'Snapshot created.',
      action: 'Creating snapshot'
    },
    'detach_volume': {
      successMessage: 'Volume has been detached.',
      action: 'Detaching volume'
    },
    'attach_volume': {
      successMessage: 'Volume has been attached.',
      action: 'Attaching volume'
    },
    'resize_volume': {
      successMessage: 'Volume has been resized.',
      action: 'Resizing volume'
    },
    'resize': {
      successMessage: 'Droplet has been resized.',
      action: 'Resizing Droplet'
    },
    'create': {
      successMessage: 'Droplet has been created.',
      action: 'Creating'
    }
  },

  dropletResizeCtrl: Ember.inject.controller('droplet.resize'),
  dropletVolumesCtrl: Ember.inject.controller('droplet.volumes'),
  dropletSnapshotCtrl: Ember.inject.controller('droplet.snapshots'),

  dropletIsShowingMore: false,
  nextPage: true,
  currentPage: 1,
  console: Ember.inject.service('console'),

  showTurnOffModal: false,

  init: function () {
    this.set('shouldOmitModal', window.localStorage && !!window.localStorage.getItem('shouldOmitModal'));
  },

  pollUntilDone: function () {
    this.pollingEvent = this.get('model.currentlyPendingEvent.content');
    return this.pollingEvent.pollEvent().then(() => {
      let onSuccess = this.pollingEvent.get('onSuccess');
      if (onSuccess) {
        onSuccess();
      }
    }).catch((err) => {
      let onFailure = this.pollingEvent.get('onFailure');
      if (onFailure) {
        onFailure();
      }
      throw err;
    }).finally(() => {
      this.pollingEvent = null;
    });
  },

  refreshModel: function () {
    return this.get('model').reload();
  },

  showMessage: function (type) {
    let message = this.get('eventMessageHash.' + type + '.successMessage');
    if (message) {
      Ember.run.later(function () {
        App.NotificationsManager.show(message, 'notice');
      }, NOTIFICATION_DELAY);
    }
  },

  onPollComplete: function (type, err) {
    return this.refreshModel().finally(() => {
      if (type === 'restore') {
        this.set('model.isRestoring', false);
        let image = this.get('model.restoreImage');
        if (image) {
          image.set('isRestoring', false);
        }
      } else if (type === 'resize') {
        this.get('dropletResizeCtrl').set('refreshModel', true);
      } else if (type === 'detach_volume') {
        this.get('dropletVolumesCtrl').set('detachingVolume', false);
      } else if (type === 'attach_volume') {
        this.get('dropletVolumesCtrl').set('pendingVolume', null);
      } else if (err && type === 'rename') {
        let oldName = this.get('model.rollbackName');
        if (oldName) {
          this.set('model.name', oldName);
        }
      }
      this.setProperties({
        eventType: null,
        showLoader: false
      });
    });
  },

  updateDropletPower: function (method) {
    if (this.get('isTogglingPower')) {
      return;
    }
    this.set('togglingPower', true);

    this.get('model')['power' + method]()
      .catch((err) => {
        this.errorHandler(err, 'Toggling Power ' + method);
      }).finally(() => {
        this.set('togglingPower', false);
      });
  },

  isTogglingPower: function () {
    return this.get('model.powerEvent') || this.get('togglingPower');
  }.property('model.powerEvent', 'togglingPower'),

  powerSwitchToolTip: function () {
    return this.get('model.isPoweredOn') ? 'Switch Off' : 'Switch On';
  }.property('model.status'),

  togglingMessage: function () {
    return 'Powering Droplet ' + (this.get('model.isPoweredOn') ? 'Off' : 'On');
  }.property('model.status'),

  updateLocalStorage: function () {
    if (!window.localStorage) {
      return;
    }

    Ember.run.next(() => {
      window.localStorage.setItem('shouldOmitModal', this.get('shouldOmitModal'));
    });
  }.observes('shouldOmitModal'),

  turnOffDroplet: function () {
    this.updateDropletPower('Off');
  },

  pollPendingEvent: function () {
    //the same event sometimes get refreshed in a few ways, so ignore it
    if(this.pollingEvent) {
      return;
    }
    let type = this.get('model.currentlyPendingEvent.type');
    if (type && type !== 'destroy') {
      let showLoader = !this.get('eventMessageHash.' + type + '.hideLoader');
      let loaderAction = this.get('eventMessageHash.' + type + '.action');
      this.set('showLoader', showLoader);
      this.set('loaderAction', loaderAction || 'Event Processing');
      this.set('eventType', type);
      this.pollUntilDone()
        .then(() => {
          if (!showLoader) {
            this.showMessage(type);
            this.onPollComplete(type);
          }
        })
        .catch((err) => {
          this.errorHandler(err, loaderAction);
          this.onPollComplete(type, true);
        });
    } else {
      this.set('showLoader', false);
      this.set('eventType', null);
    }
  }.observes('model.currentlyPendingEvent'),

  dropletTabs: function () {
    return this.dropletActionHash.filter((tab) => {
      return !(this.get('isReadOnly') && _.contains(['Destroy', 'Access', 'Resize', 'Power', 'Kernel'], tab.title));
    });
  }.property('isReadOnly'),

  isBusy: function () {
    return !!this.get('eventType') || this.get('isRenaming') || this.get('togglingPower') || this.get('model.hasBeenDestroyed') || this.get('model.hvDisabled');
  }.property('eventType', 'isRenaming', 'togglingPower', 'model.hvDisabled', 'model.hasBeenDestroyed'),

  showGraphsBeta: function() {
    return this.get('model.metricsAvailable');
  }.property('model.metricsAvailable'),

  consoleUrl: function() {
    let displayUrl = `/droplets/${this.get('model.id')}/console?no_layout=true`;
    if (App.User) {
      displayUrl += `&i=${App.User.get('shortCurrentContextId')}`;
    }
    return displayUrl;
  }.property('model.id'),

  actions: {
    powerUpDroplet: function () {
      this.updateDropletPower('On');
    },
    shutDownDroplet: function () {
      if (this.get('shouldOmitModal')) {
        this.turnOffDroplet();
      } else {
        this.set('showTurnOffModal', true);
      }
    },
    onTurnOffModalHide: function (result) {
      this.set('showTurnOffModal', false);
      if (result) {
        this.turnOffDroplet();
      }
    },

    asyncEventDone: function () {
      let type = this.get('eventType');

      this.onPollComplete(type).then(() => {
        this.showMessage(type);
      });
    },

    renameDroplet: function (newName, oldName) {
      this.setProperties({
        isRenaming: true,
        'model.rollbackName': oldName,
        isEditing: false
      });
      this.get('model').rename(newName)
        .catch((err) => {
          this.set('model.name', oldName);
          this.errorHandler(err, 'Renaming droplet');
        })
        .finally(() => {
          this.set('isRenaming', false);
        });
    },
    undoRenameDroplet: function () {
      this.set('isEditing', false);
    },
    editDropletName: function () {
      if (!this.get('isRenaming') && !this.get('isBusy')) {
        this.set('isEditing', true);
      }
    },
    openConsole: function () {
      this.get('console').show(this.get('consoleUrl'), CONSOLE_WINDOW_WIDTH, CONSOLE_WINDOW_HEIGHT, 0, `console-${this.get('model.id')}`);
    },
    pageUnloaded: function () {
      if (this.pollingEvent) {
        this.pollingEvent.cancelPoll();
        this.pollingEvent = null;
      }
      this.set('model', null);
    }
  }
});
