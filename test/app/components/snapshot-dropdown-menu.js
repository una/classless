import Ember from 'ember';
import SlideOutDropdownMenu from '../components/slide-out-dropdown-menu';
import App from '../app';

export default SlideOutDropdownMenu.extend({
  transferRecipientEmail: '',
  transferRecipientTeamId: '',
  transferType: 'user',

  onInit: function () {
    this.classNames = (this.classNames || []).concat(['aurora-snapshot-dropdown-menu']);
  }.on('init'),

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, 'isTransferringObserver');
  }.on('didInsertElement'),

  // Radio buttons require a unique ID string
  transferTypeId1: function() {
    return `transferType-${this.elementId}-1`;
  }.property(),

  transferTypeId2: function() {
    return `transferType-${this.elementId}-2`;
  }.property(),

  hasOrganizations: function() {
    return App.User.get('organizations.length') > 0;
  }.property(),

  organizations: function() {
    return App.User.get('organizations');
  }.property(),

  isTransferringObserver: function() {
    let isTransferring = this.get('isTransferring');
    let isTransferFound = this.getTransferByImageId();
    this.set('isTransferring', isTransferFound);
    if(isTransferFound !== isTransferring && this.get('isOpen')) {
      Ember.run.next(() => {
        this.resizeDropdown();
      });
    }
  }.observes('transfers', 'transfers.length'),

  doToggle: function() {
    this._super();
    if(this.get('isTransferReceived')) {
      this.set('targetViewName', 'transferReceived');
      this.showView();
    }
  },

  regionsList: function() {
    let regions = this.get('regions'),
        transferredRegions = this.get('transferredRegions'),
        hasTransferredRegions = this.get('transferredRegions.length'),
        imageRegionTransfers = this.get('regionTransfers'),
        hasImageRegionTransfers = this.get('regionTransfers').length,
        regionId = this.get('regionId'),
        isFound = false,
        isLoaderVisible = false,
        regionsAry = [];

    // loop through all regions
    // see if regionId or if any transferred regions match the current region
    // if so, then that region is enabled for this snapshot
    // otherwise, check for region transfers on the image
    // if there is a current region transfer on the image that matches the current region
    // in the loop then show the loader/spinner
    regions.forEach(function(region) {
      isFound = false;
      isLoaderVisible = false;
      if(region.get('id') === regionId) {
        isFound = true;
      } else if(hasTransferredRegions) {
        transferredRegions.forEach(function(transferredRegion) {
          if(transferredRegion.get('id') === region.get('id')) {
            isFound = true;
          }
        });
      }

      if(hasImageRegionTransfers) {
        imageRegionTransfers.forEach((transfer) => {
          if(parseInt(transfer.get('region.id'), 10) === parseInt(region.get('id'), 10)) {
            isLoaderVisible = true;
          }
        });
      }

      regionsAry.push({
        id: region.get('id'),
        slug: region.get('slug'),
        isEnabled: isFound,
        isLoaderVisible: isLoaderVisible
      });
    });

   return regionsAry;
  }.property('regions', 'transferredRegions', 'transferredRegions.length', 'regionId', 'regionTransfers', 'regionTransfers.length', 'ongoingRegionTransfers'),

  getTransferByImageId: function() {
    return this.get('transfers').rejectBy('transferred').findBy('image.id', this.get('imageId'));
  },

  clickAway: function(e) {
    if(!e || !this.$(e.target).closest('.regionButton').length){
      this._super();
    }
  },

  actions: {
    click: function(el) {
      let action = this.get('action');
      if(action) {
        this._super(el);
        // set focus to recipientEmail input field for transfer view
        if(el === 'transfer') {
          let found = this.getTransferByImageId();
          // transfer exists for this snapshot
          if(found) {
            this.set('transferRecipientEmail', found.get('recipient_email'));
            this.set('transferId', found.get('id'));

            Ember.run.later(() => {
              this.resizeDropdown();
            }, 0);

          } else {
            this.$menuDropdown.one('transitionend webkitTransitionEnd', () => {
              this.$('.recipientEmail').focus();
            });
          }
        }
      }
    },
    submitTransferSnapshot: function() {
      let self = this,
          action = this.get('transferringSnapshotAction'),
          transferType = this.get('transferType'),
          transferRecipient,
          successCallback = function() {
            self.set('isTransferring', true);
            self.set('isSubmittingTransfer', false);

            Ember.run.later((() => {
              self.resizeDropdown();
            }), 0);
          },
          errorCallback = function() {
            self.set('isTransferring', false);
            self.set('isSubmittingTransfer', false);
          };

      if (transferType === 'user') {
        transferRecipient = this.get('transferRecipientEmail');
      } else {
        let defaultTeamId = this.get('organizations.firstObject.internalIdentifier');
        transferRecipient = this.get('transferRecipientTeamId') || defaultTeamId;
      }

      if(action && transferRecipient) {
        this.set('isSubmittingTransfer', true);
        // send action to snapshots controller
        // which will make the API request
        this.sendAction(
          'transferringSnapshotAction',
          this.get('imageId'),
          transferType,
          transferRecipient,
          successCallback,
          errorCallback);
      }
    },
    cancelSnapshot: function() {
      let self = this,
          action = this.get('cancelTransferringSnapshotAction'),
          transferId = this.get('transferId'),
          successCallback = function() {
            self.set('isTransferring', false);
            self.set('transferId', null);

            Ember.run.later((() => {
              self.resizeDropdown();
            }), 0);
          },
          errorCallback = function() {
            self.set('isTransferring', true);
          };
      if(action) {
        this.sendAction('cancelTransferringSnapshotAction', this.get('imageId'), transferId, successCallback, errorCallback);
      }
    },
    renameSnapshot: function() {
      let action = this.get('renameSnapshotAction');

      if(action) {
        // close dropdown when renaming
        this.clickAway();

        this.sendAction('renameSnapshotAction', this.get('imageId'));
      }
    },
    regionButtonClick: function(el, actionParams, component) {
      let action = this.get('updateRegionAction'),
          region = component.get('region');

      if(action) {
        this.sendAction('updateRegionAction', this.get('imageId'), region.id);
      }
    },
    restoreSnapshot: function() {
      let action = this.get('restoreSnapshotAction');

      if(action) {
        this.sendAction('restoreSnapshotAction', this.get('imageId'));
      }
    },
    createFromSnapshot: function() {
      let action = this.get('createFromSnapshotAction');

      if(action) {
        this.sendAction('createFromSnapshotAction', this.get('imageId'));
      }
    },
    deleteSnapshot: function() {
      let action = this.get('deleteSnapshotAction');

      if(action) {
        this.sendAction('deleteSnapshotAction', this.get('imageId'));
      }
    },

    acceptSnapshotTransfer: function() {
      let action = this.get('acceptSnapshotTransferAction');
      if(action) {
        this.sendAction('acceptSnapshotTransferAction', this.get('transferId'));
      }
    },
    declineSnapshotTransfer: function() {
      let action = this.get('declineSnapshotTransferAction');
      if(action) {
        this.sendAction('declineSnapshotTransferAction', this.get('transferId'));
      }
    },
    onTransferTeamChange: function(teamId) {
      this.set('transferRecipientTeamId', teamId);
    }
  }
});
