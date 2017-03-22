import Ember from 'ember';
import {
  RADIX,
  MAX_PROGRESS,
  ALMOST_DONE_PROGRESS
} from '../constants';

const TRANSITION_DELAY = 50;

export default Ember.Component.extend({
  classNames: 'loading-indicator',

  setup: function () {
    this.set('isActive', true);
    this.pollEvent();
    this.updateProgress(true);

    if(this.get('startFromDoneState')) {
      let transitionClass = this.get('transitionClass');
      if(transitionClass) {
        let siblingTransitionClass = this.get('siblingTransitionClass');
        let siblingSelector = this.get('siblingSelector');
        Ember.run.later(() => {
          window.requestAnimationFrame(() => {
            let $el = this.$();
            if($el) {
              $el.removeClass(transitionClass);
              let $siblingSelector = siblingSelector && Ember.$(siblingSelector);
              if($siblingSelector) {
                $siblingSelector.removeClass(siblingTransitionClass || transitionClass);
              }
            }
          });
        }, TRANSITION_DELAY);
      }
    }
  }.on('didInsertElement'),

  preSetup: function () {
    if(this.get('startFromDoneState')) {
      let transitionClass = this.get('transitionClass');
      if(transitionClass) {
        this.$().addClass(transitionClass);
      }
    }
  }.on('willInsertElement'),

  teardown: function () {
    let event = this.get('event.content') || this.get('event');
    if(event && !this.get('dontPoll')) {
      event.cancelPoll();
    }
    this.set('isActive', false);

  }.on('willDestroyElement'),

  pollEvent: function () {
    if(!this.get('isActive') || this.get('dontPoll')) {
      return;
    }
    let event = this.get('event.content') || this.get('event');
    if(event) {
      event.pollEvent().catch(() => {
        if(this.get('onError')) {
          this.sendAction('onError', this.get('actionParams'));
        }
      });
    }
  },

  loadingComplete: function (onComplete) {
    let transitionClass = this.get('transitionClass');
    if(transitionClass) {
      let siblingTransitionClass = this.get('siblingTransitionClass');
      let siblingSelector = this.get('siblingSelector');
      window.requestAnimationFrame(() => {
        let $me = this.$().addClass(transitionClass).one('transitionend webkitTransitionEnd', () => {
          $me.off('transitionend webkitTransitionEnd');

          let parentSelector = this.get('parentSelector');
          if(parentSelector) {
            $me.closest(parentSelector).addClass('done');
          } else {
            $me.addClass('done');
          }
          if(this.get('action')) {
            this.sendAction('action', this.get('actionParams'));
          }
          if(onComplete) {
            onComplete();
          }
        });
        if(siblingSelector) {
          Ember.$(siblingSelector).addClass(siblingTransitionClass || transitionClass);
        }
      });

    } else {
      if(this.get('action')) {
        this.sendAction('action', this.get('actionParams'));
      }
      if(onComplete) {
        onComplete();
      }
    }
  },

  addTransitionEndEvent: function () {
    //todo: ensure transition exists so that loadingComplete always gets called
    let $inner = this.$('.loading-inner');
    if($inner) {
      $inner.one('transitionend webkitTransitionEnd', () => {
        $inner.off('transitionend webkitTransitionEnd');
        this.loadingComplete();
      });
    }
  },

  getProgress: function() {
    let progress = window.parseInt(this.get('event.progress'), RADIX);
    if(progress >= MAX_PROGRESS && !this.get('event.isDone')) {
      progress = ALMOST_DONE_PROGRESS;
      this.progressDoneBeforeStatus = true;
    }

    return progress;
  },

  updateProgress: function (first) {
    let $loadingBar = this.$('.loading-inner');
    if(!$loadingBar) {
      return;
    }

    let progress = this.getProgress();
    let isDone = this.get('event.isDone');

    if(first === true) {
      $loadingBar.css({
        transition: 'none',
        width: progress + '%'
      });
      if(isDone) {
        this.loadingComplete();
      }

      return Ember.run.next(function () {
        $loadingBar.css('transition', '');
      }, 0);
    }

    window.requestAnimationFrame(() => {
      if(isDone) {
        this.addTransitionEndEvent();
      }
      $loadingBar.css('width', progress + '%');
    });

  }.observes('event.progress'),

  onDone: function () {
    if(this.progressDoneBeforeStatus) {
      this.updateProgress();
    }
  }.observes('event.isDone')

});
