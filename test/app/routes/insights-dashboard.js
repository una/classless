import Ember from 'ember';
import {autocompletifyRegionList} from '../utils/autocompletify-region-list';
import PollModelMixin from '../mixins/poll-model';
import COLOR_MODES from '../services/dashboard-colormodes';
import {INSIGHTS_DASHBOARD_COLOR_THEME_KEY} from '../constants';

const ONE_MINUTE = 1000 * 60; // eslint-disable-line no-magic-numbers

export default Ember.Route.extend({
  queryParams: {
    region: {
      refreshModel: true
    },
    period: {
      refreshModel: false
    }
  },

  model() {
    return Ember.RSVP.hash({
      regions: this.store.findAll('region').then(autocompletifyRegionList)
    });
  },

  willDestroy() {
    let dwellingPoller = this.get('dwellingPoller');
    if (dwellingPoller) {
      dwellingPoller.cancelPoll();
    }

    this._super(...arguments);
  },

  actions: {
    _ac_search(key, searchVal) {
      this.set(`controller.model.${key}`, autocompletifyRegionList(this.store.peekAll('region')).filter((r) => {
        return r.get('slug').toLowerCase().indexOf(searchVal.toLowerCase()) !== -1;
      }));
    },
    didTransition: function() {
      let defaultColorMode = Object.keys(COLOR_MODES)[0];
      let controllerColorMode = this.get('controller.currentColorMode');
      let storedColorMode = window.localStorage.getItem(INSIGHTS_DASHBOARD_COLOR_THEME_KEY);

      if (!controllerColorMode) {
        let colorMode = !storedColorMode ? defaultColorMode : storedColorMode;
        Ember.$('body').removeClass('lightmode darkmode');
        Ember.$('body').addClass(`insights-dashboard ${colorMode}`);
        this.set('controller.currentColorMode', colorMode);
      }

      Ember.$('#main').addClass('nav-has-loaded');

      let poller = Ember.Object.extend(PollModelMixin);
      let dwellingPoller = poller.create();
      let self = this;

      dwellingPoller.reload = function() {
        self.segment.trackEvent('Web Behavior', {
          name: 'Dwelled on Page',
          value: 'One Minute'
        });
        return new Ember.RSVP.Promise((resolve) => { return resolve(true); });
      };

      dwellingPoller.poll(
        () => { return false; },
        () => { return false; },
        this.get('dwellingTimeout') || ONE_MINUTE);

      this.set('dwellingPoller', dwellingPoller);
      return true;
    },

    willTransition: function(transition) {
      if (transition.targetName.indexOf('insights-dashboard') === -1) {
        Ember.$('body').removeClass('insights-dashboard lightmode darkmode');
      }
      // bubble to application route
      return true;
    }
  }
});
