import Ember from 'ember';
import App from '../app';
import BaseController from '../controllers/base';

const INSIGHTS_WINDOW_WIDTH = 1200;
const INSIGHTS_WINDOW_HEIGHT = 960;
const INSIGHTS_WINDOW_TOP_OFFSET = 50;


export default BaseController.extend({
  newWindow: Ember.inject.service('newWindow'),
  insightsDashboard: App.featureEnabled('insightsDashboard'),
  actions: {
    showInsightsDashboard: function() {
      this.get('newWindow').show('/insights?no_layout=true', INSIGHTS_WINDOW_WIDTH, INSIGHTS_WINDOW_HEIGHT, INSIGHTS_WINDOW_TOP_OFFSET, 'insights-dashboard');
    }
  }
});
