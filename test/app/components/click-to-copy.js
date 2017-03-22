/* globals Clipboard: false */

import Ember from 'ember';
import ClickAway from '../mixins/click-away';

let clickToCopyIsCopying = false;

// This works around issues with click-to-copy elements within modals. See
// https://github.internal.digitalocean.com/digitalocean/aurora/pull/796.
Ember.$.fn.Modal.Constructor.prototype.enforceFocus = function () {
  Ember.$(document)
    .off('focusin.bs.modal')
    .on('focusin.bs.modal', (e) => {
      // If we're mid click-to-copy, don't try to control focus.
      if (clickToCopyIsCopying) {
        return;
      }

      // Otherwise handle normally. Copied from
      // https://github.com/twbs/bootstrap/blob/v3.3.2/js/modal.js#L131-L139
      if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
        this.$element.trigger('focus');
      }
    });
};

export default Ember.Component.extend(ClickAway, {
  classNames: 'click-to-copy',
  classNameBindings: ['noCopy', 'showCopyButton'],
  noCopy: false,

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, () => {


      this.set('noCopy', !document.queryCommandSupported || !document.queryCommandSupported('copy'));

      if(this.get('noCopy')) {
        return;
      }

      let clipboard = new Clipboard('#' + this.get('element').id, {
        text: Ember.run.bind(this, function() {
          clickToCopyIsCopying = true;
          return this.get('text');
        })
      });

      this.set('clipboard', clipboard);

      let copyAnimation = Ember.run.bind(this, function() {
        let $me = this.$().addClass('copying').one('animationend webkitAnimationEnd', () => {
          $me.removeClass('copying');
          clickToCopyIsCopying = false;
        });
      });

      clipboard.on('success', copyAnimation);
    });
  }.on('didInsertElement'),

  updateParent: function () {
    if(this.get('parentSelector')) {
      this.$().closest(this.get('parentSelector')).toggleClass('no-copy', this.get('noCopy'));
    }
  }.observes('noCopy'),

  willDestroyElement: function() {
    if(!this.get('noCopy')) {
      this.get('clipboard').destroy();
    }
  },

  copyText: function () {
    return this.get('copyMessage') || 'Copy';
  }.property('copyMessage'),

  copySuccessText: function () {
    return this.get('copySuccessMessage') || 'Copied';
  }.property('copySuccessMessage'),

  mouseEnter: function() {
    if(!this.get('noCopy') && !this.get('showLabel') && this.get('text')) {
      this.$('.Label').removeClass('hidden');
    }
  },

  mouseLeave: function() {
    if(!this.get('noCopy') && !this.get('showLabel')) {
      this.$('.Label').addClass('hidden');
    }
  }
});
