import Ember from 'ember';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import uuid from 'ember-simple-uuid';

let App;

Ember.MODEL_FACTORY_INJECTIONS = true;

const DEFAULT_RETRY_COUNT = 2;
const DISABLED_FEATURE_FLAGS_DEV_MODE = [
  'loadBalancersCreationBlocked'
];

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver,
  rootElement: '#aurora-container'
});

App.isMobile = 'ontouchstart' in window;

App.featureEnabled = function (feature) {
  if (config.environment === 'development') {
    if (DISABLED_FEATURE_FLAGS_DEV_MODE.indexOf(feature) > -1) {
      return false;
    }

    return true;
  }

  return window.featureFlags && window.featureFlags[feature];
};

App.loadScript = (function() {
  let scriptDict = {};

  return function(url, options) {
    options = Ember.$.extend(options || {}, {
      dataType: 'script',
      url: url,
      cache: true,
      timeout: 5000
    });

    let deferred = Ember.$.Deferred();

    let getScript = function(url) {
      if(scriptDict[url].retryCount > 0) {
        return Ember.$.ajax(options).fail(() => {
          scriptDict[url].retryCount--;
          getScript(url);
        });
      } else {
        // unable to load script
        return deferred.reject();
      }
    };

    if(!scriptDict.hasOwnProperty(url)) {
      scriptDict[url] = {
        retryCount: DEFAULT_RETRY_COUNT
      };

      return getScript(url);
    }

    // script already loaded
    return deferred.resolve();
  };
})();

// generate an id for request tracing
App.getUUID = function() {
  return uuid();
};

loadInitializers(App, config.modulePrefix);

export default App;
