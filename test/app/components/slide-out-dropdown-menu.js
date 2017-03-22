import Ember from 'ember';
import DropdownMenu from '../components/dropdown-menu';
import { PropTypes } from 'ember-prop-types';

export default DropdownMenu.extend({
  propTypes: {
    action: PropTypes.string,
    actionParams: PropTypes.object
  },

  targetViewName: null,
  isShowingMenuItems: true,

  setupSlideOutDropdownMenu: function() {
    // cache elements
    this.$menuDropdown = this.$().find('.menu-dropdown');
    this.$menuDropdownItems = this.$().find('.menu-dropdownItems');
    this.menuDropdownHeight = this.$menuDropdown.outerHeight();
  }.on('didInsertElement'),

  itemsChanged: function () {
    Ember.run.scheduleOnce('afterRender', this, () => {
      this.$menuDropdown.height('');
      this.$menuDropdown.height(this.menuDropdownHeight = this.$menuDropdown.outerHeight());
    });
  }.observes('items'),

  getTargetViewElt: function() {
    let $elt = this.$();
    if($elt) {
      return $elt.find('.dropdown-view--' + this.get('targetViewName').replace(/\s/g, '-').toLowerCase());
    }
    return;
  },

  showView: function() {
    let $targetViewElt = this.getTargetViewElt();
    if($targetViewElt && $targetViewElt.length) {
      let waitForLoad = $targetViewElt.hasClass('wait-for-load');
      this.show = function () {
        $targetViewElt = this.getTargetViewElt();
        // slide menu items out of the way
        this.$menuDropdownItems.addClass('dropdown-view--slideOutToLeft');

        // resize menu dropdown
        this.$menuDropdown.addClass('hasView');
        this.resizeDropdown();

        // slide target dropdown view into viewarea
        $targetViewElt.addClass('dropdown-view--slideIn');
        this.set('isShowingMenuItems', false);

        this.show = null;
      };

      if(!waitForLoad) {
        this.show();
      }
      return true;
    }
  },

  resizeDropdown: function() {
    let $elt = this.getTargetViewElt();
    if($elt && $elt.length) {
      // resize menu dropdown
      this.$menuDropdown.height($elt.outerHeight());
    }
  },

  backToMenu: function () {
    let $targetViewElt = this.getTargetViewElt();

    if($targetViewElt) {
      // slide menu items into view area
      this.$menuDropdownItems.removeClass('dropdown-view--slideOutToLeft');
      this.$menuDropdownItems.addClass('dropdown-view--slideInFromLeft');

      // resize menu dropdown
      this.$menuDropdown.removeClass('hasView');
      this.$menuDropdown.height(this.menuDropdownHeight);

      // slide target dropdown view out of view area
      $targetViewElt.removeClass('dropdown-view--slideIn');
      $targetViewElt.addClass('dropdown-view--slideOutToRight');

      this.set('isShowingMenuItems', true);
    }
  },

  onCloseDropdown: function () {
    if(!this.get('isShowingMenuItems')) {
      this.backToMenu();
    }
  },

  actions: {
    click: function(el) {
      let action = this.get('action');
      if(action) {
        this.sendAction('action', el, this.get('actionParams'));

        this.set('targetViewName', el);
        if(!this.showView()) {
          this.onMenuItemClick(el);
        }
      }
    },
    deleteRecord: function () {
      this.sendAction('deleteAction', this.get('actionParams'));
      this.set('isOpen', !this.get('closeOnClick'));
    },
    backToMenu: function() {
      this.backToMenu();
    }
  }
});
