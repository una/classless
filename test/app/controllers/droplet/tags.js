import Ember from 'ember';
import BaseController from '../base';
import { DEBOUNCE_AMOUNT } from '../../constants';

export default BaseController.extend({
  // Base Controller Properties
  trackPageName: 'Droplet Show Tags',
  routeName: 'droplet.tags',

  dropletCtrl: Ember.inject.controller('droplet'),
  showEditModal: false,
  tagToQuery: null,
  searchResults: [],
  droplet: Ember.computed.alias('model.droplet'),
  tags: Ember.computed.alias('model.tags'),
  emptyTags: Ember.computed.empty('tags'),

  updateModelTagReference: function() {
    this.set('tags', this.get('model.droplet.tags'));
  }.property('model.droplet.tags.length'),

  queryTag: function(tag) {
    this.set('tagToQuery', tag);
    Ember.run.debounce(this, this.queryToken, DEBOUNCE_AMOUNT);
  },

  actions: {
    saveTags: function(pendingTags, modalFinalizer) {
      this.get('model.droplet').putTags(pendingTags).then((tags) => {
        this.set('model.tags', tags);
        this.set('showEditModal', false);
      }).catch((err) => {
        this.errorHandler(err, 'Adding Tags');
      }).finally(() => {
        modalFinalizer(this.get('model.tags'));
      });
    },
    queryTags: function(query) {
      this.get('store').query('tag', { query: query }).then((tags) => {
        this.set('searchResults', tags);
      });
    },
    hideEditTagsModal: function() {
      this.set('showEditModal', false);
    },
    showEditTagsModel: function() {
      this.set('showEditModal', true);
    },
    tagClick: function(tagName) {
      this.trackAction('Tag click', { name: tagName });
    }
  }
});
