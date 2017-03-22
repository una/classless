/* C3 Docs: http://c3js.org/reference.html */
import TimeSeriesChart from './time-series-chart';
import Ember from 'ember';
const TRANSITION_DURATION = 650;

export default TimeSeriesChart.extend({
  setup: function() {
    this._super(...arguments);
    let $elt = this.$('.aurora-droplet-graph');
    $elt.find('svg').css('overflow', 'visible').find('.c3-grid, .c3-axis-x').removeAttr('clip-path');
  }.on('didInsertElement'),
  _updateChartLayout: function() {
    this._super(...arguments);
    this.setupClipping();
  }.observes('processedData'),
  _processIncomingData: function() {
    let data = this.get('data');
    if(data && data.length) {
      data.forEach(d => {d.id = d.name;});
    }
    this.set('processedData', data);
  }.observes('data'),
  afterDataLoaded: function() {
    let $me;
    if (this.$) {
      $me = this.$('.aurora-droplet-graph');
    }

    return (($me) => {
      Ember.run.later(() => {
        if($me) {
          //allow the grid to overflow its container, so we can do some sweet effects in CSS
          $me
            .find('svg').css('overflow', 'visible')
            .find('.c3-grid, .c3-axis-x').removeAttr('clip-path');

          window.requestAnimationFrame(function () {
            $me.addClass('loaded');
          });
        }
      }, TRANSITION_DURATION);
    })($me);
  },
  setupClipping: function() {
    let $me = this.$(this.$('div').get(0));

    // Store clip-path values for using them later when redrawing graphs with new data
    if (!this.get('gridClipPath')) {
      this.set('gridClipPath', $me.find('.c3-grid').attr('clip-path'));
    }

    if (!this.get('axisXClipPath')) {
      this.set('axisXClipPath', $me.find('.c3-axis-x').attr('clip-path'));
    }

    $me.find('svg').css('overflow', 'hidden');
    $me.find('.c3-grid').attr('clip-path', this.get('gridClipPath'));
    $me.find('.c3-axis-x').attr('clip-path', this.get('axisXClipPath'));
  }
});
