import Ember from 'ember';
import ClickAway from '../mixins/click-away';
import {ensureVisible} from '../utils/ensureVisible';

const TOGGLE_TIMEOUT = 50;

export default Ember.Component.extend(ClickAway, {
  classNames: ['aurora-dropdown-menu'],
  classNameBindings: ['classes', 'isDisabled'],
  isOpen: false,
  title: 'More',

  dropdownInsert: function () {
    let $dropdown = this.$('.menu-dropdown');

    $dropdown.on('transitionend webkitTransitionEnd', (e) => {
      let eventName = e.originalEvent.propertyName.toLowerCase();
      let isOpenTransition = eventName === 'opacity';
      if(this.get('isOpen')) {
        ensureVisible($dropdown, () => {
          if(isOpenTransition && this.get('onOpen')) {
            this.sendAction('onOpen', this.get('actionParams'));
          }
        });
      } else {
        if(!isOpenTransition && this.get('onClose')) {
          this.sendAction('onClose', this.get('actionParams'));
        }
        if(!isOpenTransition && this.onCloseDropdown) {
          this.onCloseDropdown();
        }
        $dropdown.css('display', '');
      }
    });
  }.on('didInsertElement'),

  teardown: function () {
    let $dropdown = this.$('.menu-dropdown');
    $dropdown.off('transitionend webkitTransitionEnd');
  }.on('willDestroyElement'),

  clickAway: function() {
    this.set('isOpen', false);
  },

  doToggle: function () {
    this.$('.menu-dropdown').css('display', 'block');
    Ember.run.later(() => {
      this.set('isOpen', !this.get('isOpen'));
      if(this.get('isOpen') && this.get('onOpening')) {
        this.sendAction('onOpening', this.get('actionParams'));
      }
    }, TOGGLE_TIMEOUT);
  },

  forceIsOpen: function () {
    if(this.get('forceOpen')) {
      this.doToggle();
    }

  }.observes('forceOpen'),

  onMenuItemClick: function (el) {
    let items =  this.get('items');
    let isOpen = !this.get('closeOnClick');
    if(items) {
      let menuItem = this.get('items').filter(m => m.name === el)[0];
      isOpen = isOpen || menuItem.isLoading;
    }
    this.set('isOpen', isOpen);
  },

  handleLoaded: function () {
    let isLoading = false;
    this.get('items').forEach(function (item) {
      isLoading = isLoading || item.isLoading;
    });
    if(!isLoading) {
      if(this.show) {
        Ember.run.next(this.show.bind(this));
      } else {
        this.set('isOpen', !this.get('closeOnClick'));
      }
    }
    this.set('itemsLoading', isLoading);
  }.observes('items.@each.isLoading'),

  actions: {
    click: function (el) {
      let action = this.get('action');
      if(action) {
        this.sendAction('action', el, this.get('actionParams'), this);
      }
      this.onMenuItemClick(el);
    },
    toggle: function() {
      this.doToggle();
    }
  }
});
