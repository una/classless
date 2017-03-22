import Ember from 'ember';
import ClickAway from '../mixins/click-away';
import _ from 'lodash/lodash';
import {ENTER_KEY, ESC_KEY} from '../constants';

export default Ember.Component.extend(ClickAway, {
  classNames: ['input-stepper'],
  isTyping: false,
  count: 1,
  step: 1,
  start: 1,
  min: 1,
  max: 10,

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      this.set('count', this.get('start'));
      this.$('.input-stepper-box').one('focus', this.onInputStepperBoxFocus.bind(this)
        );
    });
  }.on('didInsertElement'),


  onStartChange: function () {
    this.setProperties({
      count: this.get('start'),
      isInvalidInput: false
    });
  }.observes('start'),

  onInputStepperBoxFocus: function() {
    if(!this.get('isTyping')) {
      this.$('.input-stepper-box').click();
      Ember.run.next(() => {
        this.$('input').one('blur', this.onInputBlur.bind(this));
      });
    }
  },

  onInputBlur: function() {
    this.clickAway();
    Ember.run.next(() => {
      this.$('.input-stepper-box').one('focus', this.onInputStepperBoxFocus.bind(this));
    });
  },

  clickAway: function() {
    if(this.get('isTyping')) {
      this.updateCountFromInput();
      this.$('input').blur();
    }
  },

  updateCountFromInput: function() {
    let count = this.get('count'),
      originalCount = this.get('originalCount'),
      diff = 0,
      action;

    // is valid number
    if(/^(\d)+$/.test(count)) {
      count = Number(count);
      // limit to max if higher than max
      if(count > this.get('max')) {
        count = this.get('max');
      }

      // limit to min if lower than min
      if(count < this.get('min')) {
        count = this.get('min');
      }

      // calculate difference
      diff = originalCount - count;
      if(diff > 0) {
        action = 'decreaseAction';
      } else if(diff < 0) {
        action = 'increaseAction';
      }

      // send actions for difference
      diff = Math.abs(diff);
      if(action && this.get(action)) {
        while(diff && diff > 0) {
          this.sendAction(action);
          diff--;
        }
      }
    } else {
      // invalid value, revert to original count
      this.set('isInvalidInput', true);
      count = originalCount;
    }

    this.setProperties({
      count: count,
      isTyping: false
    });
  },

  maxlength: function() {
    let max = parseInt(this.get('max'), 10);
    return ('' + max).length;
  }.property('max'),

  isCountValid: function() {
    let count = this.get('count');
    return _.isNumber(count) &&
            count >= this.get('min') &&
            count <= this.get('max');
  }.property('count', 'min', 'max'),

  hasMax: function() {
    return this.get('count') === this.get('max');
  }.property('count', 'max'),

  hasMin: function() {
    return this.get('count') === this.get('min');
  }.property('count', 'min'),

  actions: {
    decrease: function() {
      if(!this.get('isTyping') && this.get('isCountValid')) {
        let count = Math.max(this.get('count') - this.get('step'), this.get('min'));
        if(count !== this.get('count') && this.get('decreaseAction')) {
          this.sendAction('decreaseAction');
        }
        this.set('count', count);
      }
    },
    increase: function() {
      if(!this.get('isTyping') && this.get('isCountValid')) {
        let count = Math.min(this.get('count') + this.get('step'), this.get('max'));
        if(count !== this.get('count') && this.get('increaseAction')) {
          this.sendAction('increaseAction');
        }
        this.set('count', count);
      }
    },
    setFocus: function() {
      this.setProperties({
        isInvalidInput: false,
        isTyping: true,
        originalCount: this.get('count')
      });

      Ember.run.next(() => {
        let $input = this.$('input');
        if($input && $input.length) {
          $input.one('focus', function() {
            Ember.run.next(() => {
              $input.select(); // select all text on focus
            });
          }).on('keyup', (event) => {
            if(event.which === ENTER_KEY) { // ENTER key
              this.updateCountFromInput();
              $input.off('keyup');
            } else if(event.which === ESC_KEY) { // ESC key
              this.setProperties({
                count: this.get('originalCount'),
                isTyping: false
              });
              $input.blur().off('keyup');
            }
          }).focus();
        }
      });
    }
  }
});
