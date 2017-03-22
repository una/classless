import Ember from 'ember';

const HOUR = 60 * 60 * 1000; // eslint-disable-line no-magic-numbers
const DEFAULT_POLL_TIME = 1600;

function defaultShouldReject () {
  return false;
}

export default Ember.Mixin.create({
  /**
   * Periodically calls reload() method on host object.
   *
   * @param  {function} shouldStop    This function will be called after
   *                                  each poll, with model instance
   *                                  received as reslt of reloading as first
   *                                  argument. It should return false to
   *                                  continue polling, and true to stop
   *                                  polling successfully.
   *
   * @param  {function} shouldReject  This function will be called after each
   *                                  poll, with model instance received as
   *                                  reslt of reloading as first argument.
   *                                  It should return false to continue
   *                                  polling, and any truthy value to stop
   *                                  polling as result of some error.
   *                                  Truthy value will be cast to string
   *                                  and used as rejection reason in
   *                                  resluting promise.
   *
   * @param  {Number} defaultPollTime Timeout between polls, Defaults to 800ms.
   *
   * @return {Promise}                Promise that will resolve with with
   *                                  model instance received as result of
   *                                  last reload in series of polls if
   *                                  polling was stopped successfully. And
   *                                  reject with object that has `error` key
   *                                  equal to return value of shouldReject
   *                                  callback if polling was stopped erronously.
   */
  poll: function (shouldStop, shouldReject=defaultShouldReject, defaultPollTime=DEFAULT_POLL_TIME) {
    function poller(resolve, reject, pollTime) {
      this.set('pollTimer', Ember.run.later(() => {
        let pollTimer = this.get('pollTimer');
        this.reload().then(
          (reloadedInstance) => {
            //return if the poll was cancelled while reloading
            if(!this.get('pollTimer') && this.get('canceledPollTimer') === pollTimer) {
              return;
            }
            let result;
            if (shouldStop(reloadedInstance)) {
              resolve(reloadedInstance);
            } else if (result = shouldReject(reloadedInstance)) { // eslint-disable-line no-cond-assign
              reject(result);
            } else {
              //poll again in the correct context
              poller.call(this, resolve, reject, pollTime);
            }
          }, () => {
            reject();
          }
        );
      }, pollTime));
    }

    poller = poller.bind(this); // eslint-disable-line no-func-assign
    return new Ember.RSVP.Promise((resolve, reject) => {
      Ember.run.next(function () {
        poller(resolve, reject, defaultPollTime);
      });
    });
  },

  cancelPoll: function() {
    let pollTimer = this.get('pollTimer');
    if(pollTimer) {
      Ember.run.cancel(this.set('canceledPollTimer', pollTimer));
      this.set('pollTimer', null);
    }
  },

  /*
   * Used to poll events to check if event is done processing
   */
  pollEvent: function(defaultPollTime) {
    let startedAt = new Date();

    return this.poll((reloadedEvent) => {
      return reloadedEvent.get('isDone');
    }, (reloadedEvent) => {
      if(reloadedEvent.get('hasError')) {
        return reloadedEvent;
      }
      if ((new Date()) - startedAt > HOUR) {
        return 'Event is taking too long.';
      }
      return false;
    }, defaultPollTime);
  }
});
