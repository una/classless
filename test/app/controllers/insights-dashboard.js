import Ember from 'ember';
import AutoCompleteController from '../controllers/autocomplete';
import {
  DEBOUNCE_AMOUNT,
  INSIGHTS_DASHBOARD_COLOR_THEME_KEY
} from '../constants';

const DEFAULT_PERIOD = 'hour';
const REFRESH_TIME = 30 * 1000; // eslint-disable-line no-magic-numbers
const RELOAD_AFTER = Math.ceil(5 * 60 * 1000 / REFRESH_TIME); // eslint-disable-line no-magic-numbers
const LIGHT_MODE_SWITCH_DELAY = 120;

import COLOR_MODES from '../services/dashboard-colormodes';

export default AutoCompleteController.extend({
  queryParams: ['region', 'period'],

  region: null,
  period: DEFAULT_PERIOD,

  colorPalette: [ '#1E77B4', '#32A02B', '#E3191B', '#FF7F00', '#693D9A', '#B15927', '#A6CEE3', '#B2D8A', '#FB9B99', '#FDBF6F', '#CAB2D6', '#FFFF99' ],

  dropletFilter: null,

  filteredData: [],

  commonXVal: null,

  timesRefreshed: 0,

  colorModes: Ember.inject.service('dashboardColormodes'),

  modelChanged: function() {
    this.set('loading', false);
  }.observes('model.regions'),

  cpuChartData: function() {
    return this.get('filteredData').filterBy('type', 'cpu');
  }.property('filteredData'),

  bandwidthInboundChartData: function() {
    return this.get('filteredData').filterBy('type', 'bandwidth_inbound');
  }.property('filteredData'),

  bandwidthOutboundChartData: function() {
    return this.get('filteredData').filterBy('type', 'bandwidth_outbound');
  }.property('filteredData'),

  diskReadChartData: function() {
    return this.get('filteredData').filterBy('type', 'disk_read');
  }.property('filteredData'),

  diskWriteChartData: function() {
    return this.get('filteredData').filterBy('type', 'disk_write');
  }.property('filteredData'),

  getStatsForCurrentRegion: function() {
      if (this.get('defaultSelectedRegion')) {
        this.set('refreshing', true);
        this.get('defaultSelectedRegion').getStatistics(this.get('period') || DEFAULT_PERIOD)
        .then((result) => {
          return new Ember.RSVP.Promise(function (resolve) {
            let newPayload = [];
            if (result) {
              let keys = Object.keys(result);
              let i = 0, ii = 0, key, data;

              for (i = 0;i<keys.length;i++) {
                key = keys[i];
                if (result[key] instanceof Array) {
                  data = result[key];
                  for (ii = 0; ii < data.length;ii++) {
                    data[ii].type = key;
                    data[ii].data = data[ii].chart_data || [];
                  }
                  newPayload = newPayload.concat(data);
                }
              }
            }
            resolve(newPayload);
          });
        })
        .then((formattedResult) => {
          let d = this.get('lastUpdatedTime');

          if (d && !isNaN(d.getTime())) {
            this.set('lastUpdatedTime', new Date(d));
          } else {
            this.set('lastUpdatedTime', new Date());
          }

          this.set('statsForCurrentRegion', formattedResult);
          this.filterData();
          this.set('loading', false);
          this.set('refreshing', false);
        }).finally(() => {
          let currentTimer = this.get('currentTimer');
          Ember.run.cancel(currentTimer);
          this.set('currentTimer', Ember.run.later(() => {
            if (this.get('timesRefreshed') < RELOAD_AFTER) {
              this.getStatsForCurrentRegion();
              if(!(this.get('isDestroyed') || this.get('isDestroying'))) {
                this.incrementProperty('timesRefreshed');
              }
            } else {
              // For the time being this is a way to work around memory leak in graphs.
              // @see https://jira.internal.digitalocean.com/browse/IN-559
              window.location.reload();
            }
          }, REFRESH_TIME));
        });
      }
  }.observes('defaultSelectedRegion', 'model.regions', 'period'),

  defaultSelectedRegion: function() {
    if (this.get('model.regions')) {
      let region = this.get('region');

      if (region) {
        let selectedRegion = this.get('model.regions').findBy('slug', region);

        if (selectedRegion) {
          return selectedRegion;
        }
      }

      return this.get('model.regions').sortBy('dropletCount').reverse().get('firstObject');
    } else {
      return null;
    }
  }.property('model.regions', 'region'),

  filterData: function() {
    let filter = this.get('dropletFilter');
    let data = this.get('statsForCurrentRegion');

    if (filter !== null) {
      this.set('filteredData', data.filter(function(item) {
        return item.name.toLowerCase().startsWith(filter.toLowerCase());
      }));
    } else {
      this.set('filteredData', data);
    }
  },

  showDay: function() {
    return this.get("period") !== 'hour';
  }.property("period"),

  oppositeColorMode: function() {
    let modes = Object.keys(COLOR_MODES);
    return this.get('currentColorMode') === modes[1] ? modes[0] : modes[1];
  }.property('currentColorMode'),

  oppositeColorModeName: function() {
    return COLOR_MODES[this.get('oppositeColorMode')];
  }.property('oppositeColorMode'),

  actions: {
    onSelectRegion: function(item) {
      this.transitionToRoute('insights-dashboard', {queryParams: {region: item.get('slug')}} );
    },
    onDropletFilterChanged: function() {
      Ember.run.debounce(this, this.filterData, DEBOUNCE_AMOUNT);
    },

    onUnselectRegion: Ember.K,

    toggleDropdown: function() {
      this.toggleProperty('lightModeSwitchOpen');
    },

    toggleColorMode: function() {
      this.set('currentColorMode', this.get('oppositeColorMode'));
      Ember.$('body').removeClass('lightmode darkmode');
      Ember.$('body').addClass(this.get('currentColorMode'));
      window.localStorage.setItem(INSIGHTS_DASHBOARD_COLOR_THEME_KEY, this.get('currentColorMode'));
      Ember.run.later(this.set.bind(this, 'lightModeSwitchOpen', false), LIGHT_MODE_SWITCH_DELAY);
    },

    loading: function() {
      this.set('loading', true);
    },

    onInsertChart: function(type, chart) {
      this.set(type + 'chart', chart);
    }
  }
});
