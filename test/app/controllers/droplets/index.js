import Ember from 'ember';
import App from '../../app';
import BaseController from '../../controllers/base';
import ENV from '../../config/environment';
import { get } from '../../utils/apiHelpers';
import {DEBOUNCE_AMOUNT, CONSOLE_WINDOW_WIDTH, CONSOLE_WINDOW_HEIGHT} from '../../constants';

export default BaseController.extend({
  queryParams: ['query', 'sort', 'sort_direction', 'page'],
  query: null,
  sort: 'created_at',
  sort_direction: 'desc',
  page: 1,
  console: Ember.inject.service('console'),
  appController: Ember.inject.controller('application'),
  dropletCreateEventsDisabled: false,
  computeStatusInterval: 5000,
  showEditTagsModal: false,
  searchResults: [],
  pollingEvents: [],

  pollDropletCreateEventsDisabled: function() {
    if(this.get('dropletCreateEventsDisabled')) {
      // this tells the app controller that droplet create events are disabled
      // so that the create droplets button is disabled in the nav bar
      // we'll start polling so the user knows when they can create droplets again
      this.set('appController.dropletCreateEventsDisabled', true);

      get('/' + ENV['api-namespace'] + '/compute_status').then((response) => {
        response.json().then((json) => {
          if(json.enable_create) {
            this.set('appController.dropletCreateEventsDisabled', false);
            this.set('dropletCreateEventsDisabled', false);
          } else {
            Ember.run.later(this.pollDropletCreateDisabled.bind(this), this.get('computeStatusInterval'));
          }
        });
      });
    }
  }.observes('dropletCreateEventsDisabled'),

  pollDropletTagsPending: function() {
    this.get('model').filterBy('pendingTagEvent').forEach((droplet) => {
      this.pollingEvents.push(droplet);
      droplet.pollDroplet().then(() => {
        droplet.set('pendingEvents.tags', null);
      }).finally(() => {
        this.pollingEvents.splice(this.pollingEvents.indexOf(droplet), 1);
      });
    });
  }.observes('model'),

  resetState: function (newState) {
    this.setProperties({
      searching: false,
      paginating: false,
      sorting: false
    });

    if(newState) {
      this.setProperties(newState);
    }
  },

  cancelAllPollingEvents: function() {
    this.pollingEvents.forEach(function(event) {
      event.cancelPoll();
    });

    this.pollingEvents = [];
  },

  trackAction: function (action, parameters) {
    let params = parameters || {};
    let result = {
      query: this.get('query'),
      sort_by: this.get('sort'),
      direction: this.get('sort_direction'),
      page: this.get('model.meta.pagination.current_page')
    };
    for (let attrname in params) {
      result[attrname] = params[attrname];
    }

    if(this.segment) {
      this.segment.trackEvent('Droplet Index: ' + action, result);
    }
  },

  doSearch: function () {
    this.setProperties({
      searching: true,
      typing: false,
      query: this.get('searchQuery'),
      page: 1
    });

    this.trackAction('Search');
  },

  filteredContent: function () {
    //dont show droplets being destroyed
    return this.get('model').rejectBy('destroyEvent').map(function (droplet) {
      droplet.set('wasCreated', false);
      return droplet;
    });
  }.property('model'),

  hasContent: function () {
    return !this.get('error') && this.get('filteredContent.length');
  }.property('model' ,'error'),

  emptyState: function () {
    return !this.get('hasContent') && !this.get('error') && !this.get('query');
  }.property('model', 'error'),

  hasMoreDroplets: function () {
    let model = this.get('model');
    return !this.get('error') && model.meta.pagination.next_page;
  }.property('model' ,'error'),

  isSearching: function () {
    return this.get('typing') || this.get('searching');
  }.property('typing', 'searching'),

  needsPagination: function () {
    let model = this.get('model');
    return !this.get('error') && model.meta.pagination.pages > 1;
  }.property('model' ,'error'),

  _doneSorting: function () {
    this.set('sorting', false);
  }.observes('model'),

  showTagModal: function(droplet) {
    this.set('currentDroplet', droplet);
    this.set('showEditTagsModal', true);
  },

  hardLocationChange: function(path) {
    window.location.href = path;
  },

  actions: {
    search: function() {
      this.resetState({
        typing: true
      });
      Ember.run.debounce(this, this.doSearch, DEBOUNCE_AMOUNT);
    },
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
      this.trackAction('Server Pagination Error');
    },
    menuItemClick: function (clickedKey, droplet, item) {
      this.trackAction('Menu Item Click: ' + clickedKey);

      if(clickedKey === 'Access console') {
        return this.get('console').show(`/droplets/${droplet.get('id')}/console?no_layout=true`, CONSOLE_WINDOW_WIDTH, CONSOLE_WINDOW_HEIGHT, 0, `console-${droplet.get('id')}`);
      } else if(clickedKey === 'Resize droplet') {
        return this.transitionToRoute('droplet.resize', droplet);
      } else if(clickedKey === 'Enable backups') {
        return this.transitionToRoute('droplet.backups', droplet);
      } else if(clickedKey === 'Destroy') {
        return this.transitionToRoute('droplet.destroy', droplet);
      } else if(clickedKey === 'View usage') {
        return this.transitionToRoute('droplet.graphs', droplet);
      } else if(clickedKey.indexOf('tags') > -1) {
        this.showTagModal(droplet);
        return false;
      } else if(clickedKey === 'Add a domain') {
        return this.transitionToRoute('networking.domains' , { queryParams: { dropletId: droplet.get('id') }});
      }

      this.hardLocationChange(item.replace(/{{(.*?)}}/g, function(match, key) {
        return droplet.get(key);
      }));
    },
    changePage: function() {
      this.trackAction('Change page');
      this.set('paginating', true);
    },
    saveTags: function(pendingTags, modalFinalizer) {
      this.get('currentDroplet').putTags(pendingTags).then((tags) => {
        this.set('currentDroplet.tags', tags);
        this.set('showEditTagsModal', false);
      }).catch((err) => {
        this.errorHandler(err, 'Adding Tags');
      }).finally(() => {
        modalFinalizer(this.get('currentDroplet.tags'));
      });
    },
    queryTags: function(query) {
      this.get('store').query('tag', { query: query }).then((tags) => {
        this.set('searchResults', tags);
      });
    },
    hideModal: function() {
      this.set('showEditTagsModal', false);
    },
    tagClick: function(tagName) {
      this.trackAction('Tag click', { name: tagName });
    }
  }
});
