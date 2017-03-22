import _ from 'lodash/lodash';
import Ember from 'ember';
import TypesHelper from '../utils/types';
import {
  LEFT_ARROW,
  RIGHT_ARROW
} from '../constants';

export default Ember.Component.extend({
  tagName: 'ul',
  classNames: ['target-selector'],
  classNameBindings: ['tagIsSelected', 'isFocused'],

  targets: [],
  excludeFromSearchResults: [],
  tagDropletCount: null,
  isFocused: false,

  placeholder: Ember.computed('dropletsOnly', function() {
    return this.get('dropletsOnly')
      ? 'Search for a Droplet'
      : 'Search for a Droplet or a tag';
  }),

  showTagDropletCount: Ember.computed('tagDropletCount', function() {
    // This ensures that the droplet count is displayed even if the value is 0.
    return this.get('tagDropletCount') !== null;
  }),

  toFilterFromSearchResults: Ember.computed.union('targets', 'excludeFromSearchResults'),

  validateToken: function() {
    return true;
  },

  filteredSearchResults: Ember.computed('toFilterFromSearchResults', 'searchResults', function() {
    return this.get('searchResults').filter((result) => (
      !_.some(this.get('toFilterFromSearchResults').filter((target) => {
        const id = Ember.get(target, 'id');

        // If the current target is a droplet, check for duplicate IDs
        // (since droplet names are not unique). Otherwise, it's a tag
        // and we should check for duplicate names (tag names are unique).
        if (typeof id === 'number') {
          return parseInt(id, 10) === parseInt(Ember.get(result, 'id'), 10);
        } else {
          return Ember.get(target, 'name') === Ember.get(result, 'name');
        }
      }))
    ));
  }),

  click() {
    this.focusInput();
  },

  focusIn() {
    this.set('isFocused', true);
  },

  focusOut() {
    this.set('isFocused', false);
  },

  keyDown(e) {
    const $input = this.$('.js-input');

    if ($input && $input.val().length === 0 && this.get('targets.length')) {
      const selectedTargetElement = this.get('selectedTargetElement');

      if (e.which === RIGHT_ARROW) {
        if (selectedTargetElement) {
          const next = selectedTargetElement.next();

          if (next && next.length) {
            this._clickTarget(next);
          } else {
            this.click();
          }
        }
      } else if (e.which === LEFT_ARROW) {
        if (selectedTargetElement) {
          const prev = selectedTargetElement.prev();

          if (prev && prev.length) {
            this._clickTarget(prev);
          }
        } else {
          this._clickTarget(this.$('.token-item').last());
        }
      }
    }
  },

  focusInput() {
    if (this.$('.js-input').length) {
      this.$('.js-input').focus();
    }
  },

  removeTargetByIndex(index) {
    if (index > -1) {
      this.get('targets').removeAt(index);
      this.focusInput();
    }
  },

  _removeTarget() {
    const targets = this.get('targets');

    if (targets.length) {
      const $selected = this.get('selectedTargetElement');
      const index = $selected && $selected.hasClass('token-item')
        ? $selected.index()
        : targets.length - 1;

      this.removeTargetByIndex(index);
    }
  },

  _blurTarget(elt) {
    elt.removeClass('selected');
  },

  _clickTarget(elt) {
    const $selected = this.get('selectedTargetElement');

    if ($selected) {
      $selected.removeClass('selected');
    }

    this.$('.token-input').removeClass('selected');
    elt.addClass('selected');
    this.set('selectedTargetElement', elt);
  },

  actions: {
    removeTarget() {
      this._removeTarget();
    },

    clickTarget(elt) {
      this._clickTarget(elt);
    },

    blurTarget(elt) {
      this._blurTarget(elt);
    },

    focusTarget(elt) {
      this._clickTarget(elt);
    },

    addTarget(name, result) {
      if (!result) {
        const nameMatches = this.get('filteredSearchResults').filter((target) =>
          target.get('name') === name);
        if (nameMatches.length !== 1) {
          return;
        }
        result = nameMatches[0];
      }

      if (TypesHelper.isDroplet(result) && this.get('onSelectDroplet')) {
        this.sendAction('onSelectDroplet', result);
      }

      if (TypesHelper.isTag(result) && this.get('onSelectTag')) {
        this.set('isFocused', false);
        this.sendAction('onSelectTag', result);
      }

      this.get('targets').pushObject(result);
    },

    removePreviousToken() {
      this._removeTarget();
    },

    clearTargets() {
      this.set('targets', []);
      this.set('tagDropletCount', null);
    },

    onFocusInTextInput() {
      const $selected = this.get('selectedTargetElement');

      if ($selected) {
        this._blurTarget($selected);
        this.set('selectedTargetElement', null);
      }
    }
  }
});
