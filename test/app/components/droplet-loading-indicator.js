import LoadingIndicator from '../components/loading-indicator';
import Ember from 'ember';
import {MAX_PROGRESS, ALMOST_DONE_PROGRESS} from '../constants';

const RETRY_COUNT = 6;
const WAIT_TIME_IN_MS = 500;


export default LoadingIndicator.extend({
  event: function () {
    return this.get('droplet.createEvent');
  }.property('droplet'),

  loadingComplete: function() {
    this._super(() => {
      // ip address is set and droplet is finished created
      // now we can remove the loading indicator
      this.set('droplet.isCreating', false);
    });
  },

  checkIpAddressIsAssigned: function (retryCount, waitTime) {
    this.get('droplet').reload().then((droplet) => {
      if(droplet.get('ipAddress') || !retryCount) {
        this.updateProgress();
      } else {
        Ember.run.later(() => {
          this.checkIpAddressIsAssigned(retryCount - 1, waitTime);
        }, waitTime);
      }
    });
  },

  updateProgress: function(first) {
    // droplet create failed
    if(['archive', 'error'].indexOf(this.get('event.status')) !== -1) {
      this.get('droplet').reload().then(() => {
        this.set('droplet.isCreating', false);
      });
    }

    this._super(first);
  }.observes('event.progress'),

  getProgress: function() {
    let progress = this._super();

    // if droplet.createEvent does not exist we want to keep showing the
    // loader indicator until the ipAddress is set
    this.set('droplet.isCreating', true);
    if(progress >= MAX_PROGRESS && !this.get('droplet.ipAddress')) {
      this.set('droplet.wasCreated', true);
      this.checkIpAddressIsAssigned(RETRY_COUNT, WAIT_TIME_IN_MS);
      return ALMOST_DONE_PROGRESS;
    }

    return progress;
  }
});
