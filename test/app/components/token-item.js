import Ember from 'ember';
import {ENTER_KEY, BACKSPACE_KEY} from '../constants';
import TypesHelper from '../utils/types';

export default Ember.Component.extend({
  tagName: 'li',
  classNames: 'token-item',
  classNameBindings: ['isValid', 'isGrey', 'isStatic'],
  clickToken: null,
  focusToken: null,
  blurToken: null,
  removeToken: null,
  disableClickPropagation: false,

  iconClass: function() {
    if (TypesHelper.isDroplet(this.get('item'))) {
      return 'droplet-icon';
    } else if (TypesHelper.isTag(this.get('item'))) {
      return 'tag-icon';
    } else {
      return null;
    }
  }.property('item'),

  setup: function() {
    this.$('.js-remove-token').one('keydown', (event) => {
      if(event.which === ENTER_KEY) {
        this._removeToken();
      }
    });
  }.on('didInsertElement'),

  click: function(e) {
    if (this.get('disableClickPropagation')) {
      e.stopPropagation();
    }

    this.sendAction('clickToken', this.$());
  },

  focusIn: function() {
    this.sendAction('focusToken', this.$());
  },

  focusOut: function() {
    this.sendAction('blurToken', this.$());
  },

  keyDown: function(event) {
    if(event.which === BACKSPACE_KEY) {
      this._removeToken();
    }
  },

  _removeToken: function() {
    this.sendAction('removeToken', this.get('text'), this.get('index'));
  },

  actions: {
    removeToken: function() {
      this._removeToken();
    }
  }
});
