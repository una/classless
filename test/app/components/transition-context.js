import Ember from 'ember';

const TRANSITION_DELAY = 500;

export default Ember.Component.extend({
  classNames: ['transition-context'],

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, this.startTransition);
  }.on('didInsertElement'),

  startTransition: function() {
    let $avatar = this.$('.transition-context-left-avatar');

    $avatar.one('animationend webkitAnimationEnd', () => {
      Ember.run.later(() => {
        this.$().addClass('transition-slide');
        $avatar.one('animationend webkitAnimationEnd', () => {
          this.$().addClass('transition-complete');
          if(this.get('onTransitionComplete')) {
            Ember.run.later(() => {
              this.sendAction('onTransitionComplete');
            }, TRANSITION_DELAY);
          }
        });
      }, TRANSITION_DELAY);
    });

    this.$().addClass('transition-appear');
  }
});
