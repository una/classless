import Ember from 'ember';

const LAST_STEP = 4;

export default Ember.Component.extend({
  actions: {
    setStep: function(step) {
      if(this.get('setStep') && this.get('step') !== LAST_STEP && step < LAST_STEP) {
        this.sendAction('setStep', step);
      }
    }
  }
});
