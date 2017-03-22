import Ember from 'ember';
import {LEFT_ARROW,
        RIGHT_ARROW} from '../constants';
import _ from 'lodash/lodash';

const VALID_TAG_REGEX = /^[\w\-\:]{1,255}$/;

export default Ember.Component.extend({
  classNames: ['js-aurora-tag-editor', 'tags-editor-component'],
  selectedTagElement: null,
  subHeader: 'Tags may contain letters, numbers, colons, dashes, and underscores.',
  tags: [],
  unsortedSearchResults: [],
  tagsSorting: ['name'],
  sortedSearchResults: Ember.computed.sort('unsortedSearchResults', 'tagsSorting'),
  updateTags: null,
  queryOnInput: null,

  searchResults: Ember.computed.filter('sortedSearchResults', function (result) {
    return !this._tagIsPending(result.get('name'));
  }),

  validateTag: Ember.computed(function() {
    return Ember.run.bind(this, this._validateTag);
  }),

  _tagIsPending: function(tag) {
    tag = tag || '';
    let matchingTags = this.get('tags').filter(function (result) {
      let compareName = _.isFunction(result.get) ? result.get('name') : result.name;
      compareName = compareName || '';
      return compareName.toLowerCase() === tag.toLowerCase();
    });
    return matchingTags.length > 0;
  },

  _validateTag: function(tag) {
    return !this._tagIsPending(tag) && VALID_TAG_REGEX.test(tag);
  },

  removeTokenByName: function(name) {
    name = name || '';
    let newTags = this.get('tags').filter((tag) => {
      let tagName = _.isFunction(tag.get) ? tag.get('name') : tag.name;
      tagName = tagName || '';
      return tagName.toLowerCase() !== name.toLowerCase();
    });
    this.setProperties({
      tags: newTags,
      selectedTagElement: null
    });
  },

  // we want to remove by index and not name because
  // there could be duplicate name
  removeTokenByIndex: function(index) {
    let tags = this.get('tags').slice();

    if (index > -1) {
      tags.splice(index, 1);
      this.set('tags', tags);

      // set focus on input
      if (this.$('.js-input').length) {
        this.$('.js-input').focus();
      }
    }
  },

  click: function() {
    // if email invite box is clicked and the active element is not this component
    // set the focus on the input field
    if (!Ember.$(document.activeElement).parents('.js-aurora-tag-editor').length) {
      this.$('.js-input').focus();
    }
  },

  keyDown: function(e) {
    let $input = this.$('.js-input');
    if($input && $input.val().length === 0 && this.get('tags.length')) {
      let selectedTagElement = this.get('selectedTagElement');
      if (e.which === RIGHT_ARROW) {
        if (selectedTagElement) {
          let next = selectedTagElement.next();
          if (next && next.length) {
            this._clickTag(next);
          } else {
            this.click();
          }
        }
      } else if (e.which === LEFT_ARROW) {
        if (selectedTagElement) {
          let prev = selectedTagElement.prev();
          if (prev && prev.length) {
            this._clickTag(prev);
          }
        } else {
          this._clickTag(this.$('.token-item').last());
        }
      }
    }
  },

  _clickTag: function(elt) {
    let $selected = this.get('selectedTagElement');
    if ($selected) {
      $selected.removeClass('selected');
    }
    this.$('.token-input').removeClass('selected');
    elt.addClass('selected');
    this.set('selectedTagElement', elt);
  },

  _blurTag: function(elt) {
    elt.removeClass('selected');
  },

  tagsObserver: function() {
    if (this.get('updateTags')) {
      this.sendAction('updateTags', this.get('tags').slice());
    }
  }.observes('tags.length'),

  _removeTag: function() {
    let tags = this.get('tags');
    if (tags.length) {
      let $selected = this.get('selectedTagElement');
      if ($selected && $selected.hasClass('token-item')) {
        let name = $selected.children('span')[0].innerHTML;
        this.removeTokenByName(name);
      } else {
        this.removeTokenByIndex(tags.length - 1);
      }
    }
  },

  actions: {
    removeTag: function() {
      this._removeTag();
    },
    clickTag: function(elt) {
      this._clickTag(elt);
    },
    blurTag: function(elt) {
      this._blurTag(elt);
    },
    focusTag: function(elt) {
      this._clickTag(elt);
    },
    addToken: function(name) {
      let tags = this.get('tags').slice();

      tags.push({
        name: name
      });

      this.set('tags', tags);
    },
    removePreviousToken: function() {
      this._removeTag();
    },
    onFocusInTextInput: function() {
      let $selected = this.get('selectedTagElement');
      if ($selected) {
        this._blurTag($selected);
        this.set('selectedTagElement', null);
      }
    }
  }
});
