export function initialize(container, application) {
  application.inject('model:threshold', 'enumsService', 'service:insightsThresholdEnums');
  application.inject('model:active-alert', 'enumsService', 'service:insightsThresholdEnums');
}

export default {
  name: 'insights-threshold-enums',
  initialize: initialize
};
