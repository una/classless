import Ember from 'ember';

/**
  Example Usage:

  ```
  {{edit-tags-modal
    taggable=droplet
    saveTags='saveTags'
    queryTags='queryTags'
    searchResults=searchResults
    hideModal='hideModal'
  }}
  ```
 */
export default Ember.Component.extend({
  savingTags: false,
  pendingUpdatedTags: [],
  taggable: null,
  hideModal: null,
  queryTags: null,
  saveTags: null,

  editModalTags: function() {
    this.set('pendingUpdatedTags', this.get('taggable.tags').slice());
    return this.get('taggable.tags').slice();
  }.property('taggable.tags'),

  editModalTitle: function() {
    if (this.get('editModalTags.length') > 0) {
      return 'Edit Tags';
    }
    return 'Add Tags';
  }.property('editModalTags.length'),

  editModalSaveButtonText: function() {
    if (this.get('editModalTags.length') > 0) {
      return 'Save Tags';
    }
    return 'Add Tags';
  }.property('editModalTags.length'),

  actions: {
    onEditTagsModalHide: function() {
      this.sendAction('hideModal');
    },
    updateTags: function(tags) {
      this.set('pendingUpdatedTags', tags);
    },
    queryTags: function(query) {
      this.sendAction('queryTags', query);
    },
    onEditTagsSave: function() {
      this.set('savingTags', true);
      this.sendAction('saveTags', this.get('pendingUpdatedTags'), (tags) => {
        this.set('taggable.tags', tags);
        this.set('savingTags', false);
      });
    }
  }
});