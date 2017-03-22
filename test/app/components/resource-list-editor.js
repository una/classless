import Ember from 'ember';
import TagsEditor from './tags-editor';

/**
  Example Usage:

  ```
  {{resource-list-editor
    foo="foo"
    bar="bar"
  }}
  ```
 */
export default TagsEditor.extend({

  store: Ember.inject.service(),

  highlightItem: Ember.K,
  unHighlightItem: Ember.K,

  _validateTag: function(tag) {
    return !this._tagIsPending(tag);
  },

  actions: {
    addToken: function(name) {
      let tags = this.get('tags');
      let results = this.get('unsortedSearchResults');

      let selected = results.findBy('name', name);

      if (selected && selected.get('constructor.modelName') === 'droplet') {

        tags.addObject(Ember.Object.create({
          droplet: selected,
          metrics: {},
          highlighted: false
        }));

      } else if (selected && selected.get('constructor.modelName') === 'tag') {

        tags.addObject(Ember.Object.create({
          tag: selected
        }));

      }
    },

    highlightItem: function(id) {
      this.get('highlightItem')(id);
    },
    unHighlightItem: function(id) {
      this.get('unHighlightItem')(id);
    },
    removeItem: function(index) {
      this.removeTokenByIndex(index);
    }
  }
});
