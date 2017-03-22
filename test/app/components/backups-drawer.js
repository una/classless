import Ember from 'ember';
import {ensureVisible} from '../utils/ensureVisible';

const ENSURE_VISIBLE_OFFSET = 30;
const VISIBLE_OPACITY = 0.999;

export default Ember.Component.extend({
  classNames: 'backups-drawer',
  classNameBindings: ['disabled'],

  setup: function () {
    let $me = this.$();
    $me.on('transitionend webkitTransitionEnd', (e) => {
      let showBackups = this.get('showBackups');
      let eventName = e.originalEvent.propertyName.toLowerCase();
      if(eventName === 'height') {
        $me.css({
          overflow: showBackups ? 'visible' : '',
          pointerEvents: showBackups ? 'auto' : ''
        });
        if(showBackups) {
          ensureVisible($me, null, ENSURE_VISIBLE_OFFSET);
        } else {
          $me.css('display', '');
        }
      }
    });
  }.on('didInsertElement'),

  destroy: function () {
    let $me = this.$();
    if($me) {
      $me.off('transitionend webkitTransitionEnd');
    }
  }.on('willDestroyElement'),

  toggleDrawer: function () {
    let $me = this.$();
    let showBackups = this.get('showBackups');
    if(showBackups) {
      $me.css('display', 'block');
    }
    Ember.run.next(() => {
     $me.css({
        height: showBackups ? $me[0].scrollHeight : '',
        opacity: showBackups ? VISIBLE_OPACITY : ''
      });
      if(this.get('noHeightAnimation')) {
        Ember.run.next(function () {
          $me.css('transition', 'opacity 0.3s linear');
        });
      }
    });
  }.observes('showBackups'),

  animateWhenInserting: function () {
    if(this.get('noHeightAnimation')) {
      this.$().css({
        transition: 'none',
        pointerEvents: 'auto',
        overflow: 'visible'
      });
    }
    this.toggleDrawer();
  }.on('didInsertElement'),

  toggleDropdown: function(isOpen) {
    this.$().toggleClass('backups-drawer-is-open', isOpen);
  },

  actions: {
    restore: function(imageId) {
      this.sendAction('restoreBackupAction', imageId);
    },
    createFrom: function(imageId) {
      this.sendAction('createFromBackupAction', imageId);
    },
    convertToSnapshot: function(imageId) {
      this.sendAction('convertToSnapshotAction', imageId);
    },
    openingDropdown: function() {
      this.toggleDropdown(true);
    },
    closingDropdown: function() {
      this.toggleDropdown(false);
    }
  }
});
