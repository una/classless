import Ember from 'ember';
import { ESC_KEY } from '../constants';

export default Ember.Mixin.create({
  clickAway: Ember.K,
  clickOutsideHandler: Ember.K,

  _setup: function () {
    // Keep reference to bound handler to be able to properly detach it later.
    // Each instance of this component will have it's own clickOutsideHandler
    // bound to that particular component.
    Ember.run.next(() => {
      if(this.get('isDestroyed') || this.get('isDestroying')) {
        return;
      }
      this.set('clickOutsideHandler', Ember.run.bind(this, function clickOutsideHandler(e) {
        let element = this.get('element');
        if (Ember.$(e.target).closest(element).length !== 1) {
          this.get('clickAway').call(this, e);
        }
      }));

      Ember.$('body').on('click', this.get('clickOutsideHandler'));
      if(this.get('clickAwayOnEsc')) {
        Ember.$('body').on('keyup', this.set('onEscHandler', (e) => {
          if(e.keyCode === ESC_KEY) {
            this.get('clickAway').call(this, e);
          }
        }));
      }
    });
  }.on('didInsertElement'),

  _teardown: function () {
    Ember.$('body').off('click', this.get('clickOutsideHandler'));
    if(this.get('clickAwayOnEsc')) {
      Ember.$('body').off('keyup', this.get('onEscHandler'));
    }
  }.on('willDestroyElement')
});
