import Ember from 'ember';

export default Ember.Component.extend({
  classNames: 'reveal-toggle Revealer',
  isOpen: false,

  toggle: function() {
    let revealId = this.get('reveal-id');

    if(revealId) {
      let revealClassOpen = 'is-open';
      let revealerShelf = Ember.$('#' + revealId);
      let revealerShelfInner = revealerShelf.find('.shelf-inner');
      let shelfHeight = this.get('isOpen') ? 0 : revealerShelfInner.outerHeight(true);

      this.$().toggleClass(revealClassOpen);
      revealerShelf.toggleClass(revealClassOpen).height(shelfHeight);
      this.set('isOpen', !this.get('isOpen'));
    }
  },

  click: function(el) {
    let action = this.get('action');

    this.toggle();

    if(action) {
      this.sendAction('action', el);
    }
  }
});
