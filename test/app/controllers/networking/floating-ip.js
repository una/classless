import AutoCompleteController from '../../controllers/autocomplete';
import _ from 'lodash/lodash';
import Ember from 'ember';
import {DEBOUNCE_AMOUNT} from '../../constants';

// In this controller, the Floating IP model is polled as opposed to their events because there are two actions
// that happen when assigning and deleting. When assigning a new Floating IP to a droplet, there is a reserve event
// and then the assign event. These happen consecutively. Similarly, deleting a Floating IP involves unassigning the
// Floating IP from the droplet and then deleting it. There is no Floating IP delete event, so the model is polled
// until the response status is a 404.

export default AutoCompleteController.extend({
  queryParams: ['sort', 'sort_direction', 'page'],
  sort: 'ip',
  sort_direction: 'desc',
  page: 1,
  trackPageName: 'Networking Floating Ips',
  paginating: false,
  menuTitle: 'More',
  listItems: ['Reassign', 'Unassign', 'Delete'],
  assignedDroplet: null,
  dropletDefaultItem: 'Unassign floating IP',
  pollingEvents: [],
  pollingDeleteEvents: [],

  filteredFloatingIps: function() {
    return this.get('newFloatingIps').filter(function(model) {
      return !model.get('isReserving') || !model.get('isAssigning') || !model.get('isDeleted') || model.get('isDirty') || model.get('isSaving');
    }).concat(this.floatingIps.toArray());
  }.property('newFloatingIp.isSaving', 'newFloatingIps.length', 'newFloatingIps.@each.isSaving', 'newFloatingIps.@each.isDeleted'),

  cleanupNewFloatingIps: function() {
    this.set('newFloatingIps', []);
  }.observes('floatingIps'),

  findDisabledIndicies: function (key) {
    let indices = [];
    let model = this.get(key);

    if(model) {
      model.forEach(function(model, index) {
        if (model.get('hasFloatingIps') ) {
          indices.push({ index: index, reason: 'Droplet already has a floating IP'});
        } else if (model.get('server.offline')) {
          indices.push({ index: index, reason: 'Droplet server is offline'});
        } else if(model.get('currentlyPendingEvent.id')) {
          indices.push({ index: index, reason: 'Droplet is currently processing another event'});
        }
      });
    }

    return indices;
  },

  assignableDropletsDisabledModelIndices: function() {
    return this.findDisabledIndicies('autoCompleteItems');
  }.property('autoCompleteItems'),

  disabledDropletsRegionIndicies: function() {
    return this.findDisabledIndicies('dropletsRegion');
  }.property('dropletsRegion'),

  getQueryParams: function() {
    return {
      page: this.get('page'),
      sort: this.get('sort'),
      sort_direction: this.get('sort_direction')
    };
  },

  doneSorting: function () {
    this.set('sorting', false);
  }.observes('floatingIps'),

  setEventProp: function(floatingIp, val) {
    let eventState;
    let eventType = floatingIp.get('latestPublicEvent.content.type');

    switch(eventType) {
      case 'reserve_ip':
        eventState = 'isReserving';
        break;
      case 'assign_ip':
        eventState = 'isAssigning';
        break;
      case 'unassign_ip':
        eventState = 'isUnassigning';
        break;
      case 'release_ip':
        eventState = 'isDeleting';
        break;
    }

    if(eventState) {
      floatingIp.set(eventState, val);
    }
  },

  pollFloatingIps: function() {
    if(this.get('floatingIps.length')) {
      this.get('floatingIps').forEach((floatingIp) => {
        if(floatingIp.get('latestPublicEvent') && !floatingIp.get('latestPublicEvent.isDone') && !floatingIp.get('latestPublicEvent.hasError')) {
          this.onPollFloatingIp(floatingIp);
        }
      });
    }
  }.observes('floatingIps.@each.latestPublicEvent'),

  onPollFloatingIp: function(floatingIp) {
    let event = floatingIp.get('latestPublicEvent.content');
    if(event && this.pollingEvents.indexOf(floatingIp) === -1) {
      this.pollingEvents.push(floatingIp);
      this.setEventProp(floatingIp, true);

      floatingIp.pollFloatingIp().then(() => {
        this.pollingEvents.splice(this.pollingEvents.indexOf(floatingIp), 1);
      }).finally(() => {
        this.setEventProp(floatingIp, false);
        this.pollingEvents.splice(this.pollingEvents.indexOf(floatingIp), 1);
      });
    }
  },

  onPollDeletingFloatingIp: function(floatingIp) {
    if(this.pollingDeleteEvents.indexOf(floatingIp) === -1) {
      this.pollingDeleteEvents.push(floatingIp);
      // floating ip should 404
      floatingIp.pollDeletingFloatingIp().catch(() => {
        this.send('reloadFloatingIps', this.getQueryParams());
        this.send('resetAutoComplete');
        this.pollingDeleteEvents.splice(this.pollingDeleteEvents.indexOf(floatingIp), 1);
      });
    }
  },

  cancelAllPollingEvents: function() {
    this.pollingEvents.forEach(function(event) {
      event.cancelPoll();
    });

    this.pollingDeleteEvents.forEach(function(event) {
      event.cancelPoll();
    });

    this.pollingEvents = [];
    this.pollingDeleteEvents = [];
  },

  /* Floating IP Table */
  getMenuItems: function(toFilter) {
    toFilter = toFilter || [];

    return _.map(_.difference(this.listItems, toFilter), function (key) {
       return { name: key };
     });
  },

  menuItems: function() {
    return this.getMenuItems();
  }.property(),

  menuItemsUnassigned: function() {
    return this.getMenuItems(['Unassign']);
  }.property(),

  needsPagination: function () {
    return this.get('floatingIps').meta.pagination.pages > 1;
  }.property('floatingIps'),

  handleSelected: function (droplet) {
    if(droplet.type === 'default') {
      this.unassign(this.get('autoCompleteFloatingIp'));
    } else {
      let needsUpgrade = droplet.get('needsManualSetupForFloatingIp');

      if(needsUpgrade) {
        this.showUpgradeModal(droplet);
      } else {
        this.reassign(droplet);
      }
    }
  },

  showUpgradeModal: function(droplet) {
    this.setProperties({
      upgradeDroplet: droplet
    });
  },

  resetUpgradeProperties: function() {
    this.setProperties({
      isUpgrading: false,
      selectedFloatingIp: null,
      upgradeDroplet: null,
      autoCompleteFloatingIp: null
    });
  },

  dropletsRegionShowingMore: function() {
    return this.get('dropletsRegionPaginating');
  }.property('dropletsRegionPaginating'),

  reassign: function(droplet) {
    let floatingIp = this.get('autoCompleteFloatingIp');
    droplet = droplet || this.get('upgradeDroplet');

    floatingIp.set('isReassigning', true);
    this.set('isUpgrading', true);
    floatingIp.reassign(droplet.get('id')).then(() => {
      floatingIp.reload();
    }).catch((err) => {
      this.errorHandler(err, 'Reassigning Floating Ip');
    }).finally(() => {
      floatingIp.set('isReassigning', false);
      this.resetUpgradeProperties();
    });
  },

  unassign: function(floatingIp) {
    floatingIp.set('isUnassigning', true);
    floatingIp.unassign().then(() => {
      this.send('reloadFloatingIps', this.getQueryParams());
    }).catch((err) => {
      this.errorHandler(err, 'Unassigning Floating Ip');
    }).finally(() => {
      this.set('autoCompleteFloatingIp', null);
    });
  },

  showAutoComplete: function(floatingIp) {
    this.send('resetAutoComplete');
    this.set('autoCompleteFloatingIp', floatingIp);
  },

  doSearch: function(searchStr) {
    this.send('queryDroplets', {
      region: this.get('selectedFloatingIp.region.slug'),
      query: searchStr
    });

    this.setProperties({
      dropletSearching: true,
      dropletTyping: true,
      dropletsQuery: searchStr
    });
  },

  actions: {
    menuItemClick: function(clickedKey, key) {
      this.trackAction('Menu Item Click: ' + clickedKey);
      if(clickedKey === 'Reassign') {
        this.send('showAutoComplete', key);
      } else if(clickedKey === 'Unassign') {
        this.unassign(key);
      } else if(clickedKey === 'Delete') {
        this.set('floatingIpToDelete', key);
      }
    },
    /* Delete Floating IP */
    onDeleteModalHide: function(isDeleting) {
      if(isDeleting) {
        let floatingIp = this.get('floatingIpToDelete');
        let dropletId = this.get('floatingIpToDelete.droplet.id');
        floatingIp.set('isDeleting', true);

        this.get('floatingIpToDelete').release(dropletId).then(() => {
          this.onPollDeletingFloatingIp(floatingIp);
        }).catch((err) => {
          this.errorHandler(err, 'Deleting Floating Ip');
          floatingIp.set('isDeleting', false);
        });
      }

      this.set('floatingIpToDelete', null);
    },
    /* Upgrade Floating IP */
    onUpgradeModalHide: function(isUpgrading) {
      if(isUpgrading) {
        this.reassign();
      } else {
        this.resetUpgradeProperties();
        this.send('handleDropletHide');
      }
    },
    /* Table autocomplete */
    showAutoComplete: function(floatingIp) {
      this.send('queryDroplets', {
        region: floatingIp.get('region.slug')
      });
      this.setProperties({
        selectedFloatingIp: floatingIp,
        dropletsRegionPaginating: true
      });
      this.showAutoComplete(floatingIp);
    },
    handleDropletInput: function (val) {
      Ember.run.debounce(this, this.doSearch, val, DEBOUNCE_AMOUNT);
    },
    handleDropletSelect: function (selected) {
      this.handleSelected(selected);
    },
    handleDropletShowMore: function () {
      if(!this.get('dropletsRegionPaginating') && this.get('dropletsRegion.meta.pagination.next_page')) {
        this.set('dropletsRegionPaginating', true);
        this.send('queryDroplets', {
          region: this.set('selectedFloatingIp.region.slug'),
          query: this.get('dropletsQuery'),
          page: this.get('dropletsRegion.meta.pagination.next_page')
        });
      }
    },
    handleDropletHide: function() {
      this.setProperties({
        dropletsRegion: null,
        autoCompleteFloatingIp: null,
        dropletsQuery: ''
      });
    },
    queryDropletsLoaded: function() {
      this.setProperties({
        dropletSearching: false,
        dropletTyping: false,
        dropletsRegionPaginating: false
      });
    },
    queryDropletsError: function(err) {
      this.errorHandler(err, 'Querying Droplets');
    },
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    modelLoaded: function () {
      this.set('paginating', false);
    },
    /* Assign Floating IP form */
    onAssignFloatingIpToDroplet: function() {
      let droplet = this.get('assignedDroplet');
      let floatingIp = this.store.createRecord('floatingIp');

      floatingIp.setProperties({
        ip: 'Assigning IP',
        region: droplet.get('region'),
        createdAt: new Date(),
        isReserving: true
      });

      this.set('isAssigningFloatingIp', true);

      let pendingSave = floatingIp.allocateFromDroplet(droplet.get('id')).then((resp) => {
          // reset assigned Droplet from autocomplete in assign a floating ip form
          this.set('assignedDroplet', null);

          resp.json().then((json) => {
            let event = json.floating_ip.currently_pending_event;
            floatingIp.setProperties({
              id: json.floating_ip.id,
              ip: json.floating_ip.ip,
              isAssigning: event.type === 'assign_ip' && event.status !== 'done'
            });

            // find floating ip in DB to get its properties
            this.store.findRecord('floatingIp', json.floating_ip.id).then((model) => {
              let newFloatingIps = this.get('newFloatingIps');
              newFloatingIps.shift();
              newFloatingIps.unshift(model);
              this.set('newFloatingIps', newFloatingIps);
              this.set('newFloatingIp', model);

              this.onPollFloatingIp(model);
            });
          });
      }).catch((err) => {
        let newFloatingIps = this.get('newFloatingIps');
        newFloatingIps.shift();
        this.set('newFloatingIps', newFloatingIps);
        this.set('newFloatingIp', null);
        this.errorHandler(err, 'Assigning Floating Ip');
      }).finally(() => {
        floatingIp.set('isReserving', false);
        this.setProperties({
          assignAutoCompleteReset: true,
          isAssigningFloatingIp: false
        });

        Ember.run.next(() => {
          this.set('assignAutoCompleteReset', false);
        });
      });

      let newFloatingIps = this.get('newFloatingIps');
      newFloatingIps.unshift(floatingIp);
      this.set('newFloatingIps', newFloatingIps);
      this.set('newFloatingIp', floatingIp);

      this.transitionToRoute('networking.floatingIp', {
        queryParams: {
          page: 1,
          sort: 'ip',
          sort_direction: 'desc',
          pendingSave: pendingSave
        }
      });

    },
    onUnselectDroplet: function() {
      this.set('assignedDroplet', null);
    },
    onSelectDroplet: function(selected) {
      if(selected) {
        this.set('assignedDroplet', selected);
      }
    }
  }
});
