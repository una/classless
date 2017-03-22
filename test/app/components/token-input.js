import Ember from 'ember';
import _ from 'lodash/lodash';
import {ENTER_KEY,
        COMMA_KEY,
        SPACE_BAR,
        TAB_KEY,
        BACKSPACE_KEY,
        UP_ARROW,
        DOWN_ARROW} from '../constants';

const DEFAULT_MIN_TOKEN_LENGTH = 2;

export default Ember.Component.extend({
  tagName: 'span',
  classNames: 'token-input',
  type: 'text',

  autofocus: true,
  allowNewTokens: true,
  showCount: true,
  searchResults: [],

  // This index indicates the initial position of the selected element in the dropdown menu for search results.
  // Since we append the user input data to any collection, we start the index reference at -1 to avoid
  // putting unnecessary logic in the template.
  selectedSearchResultIndex: -1,

  searchTerm: null,

  searchResultsToDisplay: function() {
    if (!this.get('allowNewTokens')) {
      return this.get('searchResults');
    }
    return this.get('searchResults').filter((result) => {
      const name = result.get('name') || '';
      const searchTerm = this.get('searchTerm') || '';
      return name.toLowerCase() !== searchTerm.toLowerCase();
    });
  }.property('searchResults.[]'),

  setup: function() {
    let $input = this.$('.js-input');
    if($input.length) {
      $input.on('paste', this.paste.bind(this));
    }
  }.on('didInsertElement'),

  resetSearchIndexOnNewResults: function() {
    this.set('selectedSearchResultIndex', -1);
  }.observes('searchResults'),

  setInput: function(input, result) {
    this._input(input, result);
    this._clearInput();
  },

  focusOut: function(event) {
    if(!this.get('searchResults.length')) {
      let input = event.target.value.trim();
      this.setInput(input);
    }
  },

  focusIn: function() {
    if(this.get('onFocusIn')) {
      this.sendAction('onFocusIn');
    }
  },
  paste: function(event) {
    let inputs = event.originalEvent.clipboardData.getData('text/plain').trim().split(/\s|,/);
    let handledInput = false;

    inputs = _.uniq(inputs);

    inputs.forEach((input) => {
      input = input.trim();
      if(input) {
        this._input(input);
        handledInput = true;
      }
    });

    if(handledInput) {
      event.preventDefault();
      this._clearInput();
    }
  },

  keyUp: function(event) {
    // For target-selector and other token selectors that don't allow
    // new, non-existent strings to be added, we also want to ignore
    // space and enter.
    const keysToIgnore = this.get('allowNewTokens')
      ? [UP_ARROW, DOWN_ARROW]
      : [UP_ARROW, DOWN_ARROW, SPACE_BAR, ENTER_KEY];

    let input = event.target.value;

    if(input) {
      input = input.trim();
    }

    if(this.get('queryOnInput') && !_.contains(keysToIgnore, event.which)) {
      this.set('searchTerm', input);
      this.queryOnInput(input);
    }
  },

  keyPress: function(event) {
    let input = event.target.value;
    let result;

    if(input) {
      input = input.trim();
    }

    if([ENTER_KEY, COMMA_KEY, SPACE_BAR, TAB_KEY].indexOf(event.which) !== -1) {
      event.preventDefault();
      // If we have the search box activated, grab the input from the selected item in the list
      // when the user presses the enter key.
      const enterFromResultsList = event.which === ENTER_KEY &&
        this.get('searchResultsToDisplay.length');

      if (enterFromResultsList) {
        let index = this.get('selectedSearchResultIndex');
        if (index > -1) {
          result = this.get('searchResultsToDisplay')[index];
          input = result.get('name');
        }
      }

      // We only want to add a new token if the context we're in allows new,
      // non-existent strings (a la the tags editor). Otherwise, we ignore
      // everything but the enter key (which will always add the selected item).
      if (enterFromResultsList || this.get('allowNewTokens')) {
        this._input(input, result);
        this._clearInput();
      }
    }

    // prevent the backspace button from navigating back
    if(!input && event.which === BACKSPACE_KEY) {
      event.preventDefault();
    }
  },

  _scrollToSelected: function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      let $selected = this.$('.is-selected');
      if ($selected && $selected.length) {
        $selected[0].scrollIntoViewIfNeeded(false);
      }
    });
  },

  keyDown: function(event) {
    if(this.get('searchResultsToDisplay.length')) {
      let selectedIndex = this.get('selectedSearchResultIndex');
      if (event.which === UP_ARROW) {
        if (selectedIndex > -1) {
          this.set('selectedSearchResultIndex', selectedIndex - 1);
          this._scrollToSelected();
        }
        return false;
      } else if (event.which === DOWN_ARROW) {
        if (selectedIndex < this.get('searchResultsToDisplay.length') - 1) {
          this.set('selectedSearchResultIndex', selectedIndex + 1);
          this._scrollToSelected();
        }
        return false;
      }
    }

    let input = event.target.value;

    if(input) {
      input = input.trim();
    }

    if(!input && event.which === BACKSPACE_KEY && this.get('removePreviousToken')) {
      this.sendAction('removePreviousToken');
    }
  },

  // a default validation function that can be overwritten if there are more restrictions on the token
  validateToken: function(token) {
    return token.length > DEFAULT_MIN_TOKEN_LENGTH;
  },

  _clearInput: function() {
    this.set('searchTerm', null);
    this.$('.js-input').val('');
  },

  _input: function(input, result) {
    if(input && this.get('addToken')) {
      let tokens = input.split(',').map(function(part) {
        return part.trim();
      });

      tokens = tokens.filter((token) => {
        return this.validateToken(token);
      });


      tokens.forEach((value) => {
        this.sendAction('addToken', value, result);
      });
    }
  },

  actions: {
    selectResult: function(input, result) {
      this.setInput(input, result);
    }
  }
});
