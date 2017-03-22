import Ember from 'ember';
import App from '../../app';
import {
  MS_IN_ONE_MINUTE,
  STATUS_CODE_OK
} from '../../constants';
import PollModelMixin from '../../mixins/poll-model';

function getDropletStats(droplet, period) {
  return Ember.RSVP.hash({
    bandwidth: droplet.getStatistics('bandwidth', period),
    cpu: droplet.getStatistics('cpu', period),
    disk: droplet.getStatistics('disk', period),

    memory: droplet.getTimeSeriesStatistics('sonar_memory_memtotal', period),
    diskUsage: droplet.getTimeSeriesStatistics('sonar_disk_space', period),

    tsBandwidthIn: droplet.getTimeSeriesStatistics('sonar_network_receive_bytes', period),
    tsBandwidthOut: droplet.getTimeSeriesStatistics('sonar_network_transmit_bytes', period),
    tsCPU: droplet.getTimeSeriesStatistics('sonar_cpu', period),
    tsDiskIOWrite: droplet.getTimeSeriesStatistics('sonar_disk_bytes_written', period),
    tsDiskIORead: droplet.getTimeSeriesStatistics('sonar_disk_bytes_read', period),

    tsTopProcessesByCPU: droplet.getTimeSeriesStatistics('sonar_top_process_cpu', 'minute'),
    tsTopProcessesByMemory: droplet.getTimeSeriesStatistics('sonar_top_process_memory', 'minute'),

    droplet: droplet
  });
}

export default Ember.Route.extend({
  queryParams: {
    period: {
      refreshModel: false
    }
  },

  initRoute: function () {
    this.initialModelLoad = true;
  }.on('deactivate', 'init'),

  model: function (params) {
    params = params || { period: 'hour' };
    params.period = params.period || 'hour';

    return getDropletStats(this.modelFor('droplet'), params.period);
  },

  setupController: function(controller, models) {
    let droplet = this.modelFor('droplet');
    controller.set('droplet', droplet);
    controller.set('model', models);
    controller.set('getDropletStats', getDropletStats);
    this.controller = controller;
  },

  cancelPolling: function () {
    let modelPoller = this.get('modelPoller');
    if (modelPoller) {
      modelPoller.cancelPoll();
      this.set('modelPoller', null);
    }
  },

  willDestroy() {
    this.cancelPolling();
    this._super(...arguments);
  },

  actions: {
    loading: function () {
      if (!this.initialModelLoad) {
        this.controller.send('loading');
      }
      return this.initialModelLoad;
    },

    willTransition: function () {
      this.cancelPolling();
      this._super(...arguments);
      // bubble to application route
      return true;
    },

    didTransition: function () {
      this.initialModelLoad = false;

      if (App.featureEnabled('graphsPolling')) {
        let poller = Ember.Object.extend(PollModelMixin);
        let modelPoller = poller.create();

        modelPoller.reload = () => {
          let period = this.controller.get('period');
          let oldModel = this.controller.get('model');
          let droplet = oldModel.droplet;
          return getDropletStats(droplet, period).then((result) => {
            this.controller.set('model', result);
          });
        };

        modelPoller.poll(
          () => {
            let droplet = this.controller.get('model.droplet');
            return droplet.get('hasBeenDestroyed') ||
                droplet.get('timeseriesServiceStatus') !== STATUS_CODE_OK ||
                droplet.get('statisticsServiceStatus') !== STATUS_CODE_OK;
          },
          () => { return false; },
          MS_IN_ONE_MINUTE
        );

        this.set('modelPoller', modelPoller);
      }
    }
  }
});
