import App from '../app';
import BaseController from '../controllers/base';

export default BaseController.extend({
  loadBalancersEnabled: App.featureEnabled('loadBalancers'),
  securityGroupsEnabled: App.featureEnabled('securityGroups'),

  // Children of the `networking` route can elect to hide the "Networking"
  // header and subnavigation by overriding `renderTemplate` in their routes.
  // However, the header and subnav will still appear during the loading phase.
  // To prevent this, routes can set the property below in beforeModel() and
  // deactivate(). See routes/networking/load-balancers/new.js for an example.
  hideNetworkingHeader: false
});
