import Ember from 'ember';
import { PropTypes } from 'ember-prop-types';
import App from '../app';
import PollModelMixin from '../mixins/poll-model';
import { MS_IN_SECONDS } from '../constants';

/**
  Example Usage:

  ```
  {{agent-installation-modal
    droplet=model.droplet
    onHide=(action 'onAgentInstallationHidden')
  }}
  ```
 */
export default Ember.Component.extend({
  propTypes: {
    monitoringEnabled: PropTypes.bool,
    droplet: PropTypes.droplet
  },
  monitoringEnabled: App.featureEnabled('monitoringPreferences'),
  startPolling: function() {
    let poller = Ember.Object.extend(PollModelMixin);
    let agentInstallationPoller = poller.create();
    agentInstallationPoller.reload = () => {
      let droplet = this.get('droplet');
      if(droplet) {
        return droplet.getHostMetrics().then(() => {
          if (droplet.get('metricsAvailable')) {
            window.location.reload();
          }
        });
      } else {
        return Ember.RSVP.Promise.resolve();
      }
    };

    agentInstallationPoller.poll(
      () => { return false; },
      () => { return false; },
      MS_IN_SECONDS,
    );

    this.set('agentInstallationPoller', agentInstallationPoller);
  },
  cancelPolling: function() {
    let agentInstallationPoller = this.get('agentInstallationPoller');
    if (agentInstallationPoller) {
      agentInstallationPoller.cancelPoll();
      this.set('agentInstallationPoller', null);
    }
  },
  actions: {
    onShowModal: function() {
      this.startPolling();
      this.sendAction('onShow', null, this);
    },
    onHideModal: function() {
      this.cancelPolling();
      this.sendAction('onHide', null, this);
    }
  }
});