import Ember from 'ember';
import DropletsController from '../controllers/droplets/index';

export default DropletsController.extend({
  // Base Controller Overrides
  trackPageName: 'Tag',

  tagName: null,
  totalDroplets: Ember.computed.alias('model.meta.pagination.total'),

  filteredContent: function () {
    try {
      //Remove droplets that have removed this tag from their collection.
      return this._super().filter((droplet) => {
        return droplet.get('tags').any((tag) => {
          let tagName = tag.id || tag.name;
          return tagName === this.get('tagName');
        });
      });
    } catch (e) {
      this.logException(e);
      this.set('error', true);
    }
  }.property('model', 'model.@each.tags'),

  hasContent: function () {
    return !this.get('error') && this.get('filteredContent.length');
  }.property('model', 'error', 'filteredContent.length')
});
