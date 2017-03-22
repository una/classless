import Ember from 'ember';
import {
  ALMOST_DONE_PROGRESS,
  MAX_PROGRESS,
  MAX_PERCENTS
} from '../../constants';

export default Ember.Component.extend({
  classNames: ['loading-indicator', 'time-based-loading-indicator'],
  classNameBindings: [
    'isDoneTransitioning:done',
    'isDoneClass'
  ],

  interval: 3000,
  timeElapsed: 0,
  // Needs to match the opacity transition duration of your transitionClass.
  fadeOutTransitionDuration: 300,
  // Needs to match the transition duration on .loading-inner in _loading-indicator.scss.
  widthTransitionDuration: 1500,
  isDone: false,
  isDoneTransitioning: false,

  init: function() {
    this._super(...arguments);
    this.start();
  },

  isDoneClass: Ember.computed('isDone', function() {
    return this.get('isDone')
      ? this.get('transitionClass')
      : null;
  }),

  progressPercentage: Ember.computed('timeElapsed', function() {
    return Math.min(ALMOST_DONE_PROGRESS, Math.round(
      this.get('timeElapsed') / this.get('estimatedTimeInMs') * MAX_PERCENTS
    ));
  }),

  loadingInnerStyle: Ember.computed('progressPercentage', function() {
    return Ember.String.htmlSafe(`width: ${this.get('progressPercentage')}%`);
  }),

  stateChanged: Ember.on('init', Ember.observer('loadBalancer.state', function() {
    const state = this.get('loadBalancer.state');

    if (state === 'ACTIVE') {
      this.set('progressPercentage', MAX_PROGRESS);

      // This delay gives the progress bar time to transition to 100%
      // before fading out.
      Ember.run.later(() => {
        this.loadingComplete();
      }, this.get('widthTransitionDuration'));
    } else if (state === 'ERROR') {
      if (this.get('onError')) {
        this.get('onError')();
      }
    }
  })),

  start: function() {
    this.update();
    this.set('intervalId', window.setInterval(() => {
      this.update();
    }, this.get('interval')));
  },

  stop: function() {
    window.clearInterval(this.get('intervalId'));
  },

  update: function() {
    const timeElapsed = Date.now() - this.get('loadBalancer.createdAtMs');

    if (timeElapsed < this.get('estimatedTimeInMs')) {
      Ember.run(() => this.set('timeElapsed', timeElapsed));
    } else {
      this.stop();
    }
  },

  willDestroy() {
    this._super(...arguments);
    this.stop();
  },

  loadingComplete: function() {
    this.stop();
    this.set('isDone', true);

    // The `transitionend` event isn't always perfectly reliable, so we rely on
    // a timeout instead. For more: https://github.com/facebook/react/issues/1326.
    Ember.run.later(() => {
      this.set('isDoneTransitioning', true);

      if (this.get('onComplete')) {
        this.get('onComplete')();
      }
    }, this.get('fadeOutTransitionDuration'));
  }
});
