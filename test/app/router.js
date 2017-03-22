import Ember from 'ember';
import App from './app';
import config from './config/environment';
import _ from 'lodash/lodash';

let Router = Ember.Router.extend({
  location: config.locationType
});


export default Router.map(function() {
  this.route('sketchy', { path: '/account_verification/edit' }, function() {
    this.route('deactivate', { path: '/deactivate' });
  });

  this.route('droplets', { path: '/droplets' }, function() {
    this.route('volumes');
  });
  this.route('welcome', { path: '/welcome'});
  this.route('volumes', { path: '/volumes'} );

  this.route('networking', { path: '/networking'}, function() {
    this.route('floatingIp', { path: '/floating_ips' }, function() {
      this.route('datacenter');
      this.route('increase');
    });

    this.route('domains', { path: '/domains' });
    this.route('domains-record');

    this.route('ptr');

    if (App.featureEnabled('loadBalancers')) {
      this.route('loadBalancers', { path: '/load_balancers' }, function() {
        this.route('new');
        this.route('show', { path: '/:load_balancer_id' }, function() {
          this.route('droplets');
          this.route('graphs');
          this.route('settings');
          this.route('destroy');
        });
      });
    }

    if (App.featureEnabled('securityGroups')) {
      this.route('securityGroups', { path: '/firewalls' }, function() {
        this.route('new');
        this.route('show', { path: '/:security_group_id' });
      });
    }
  });

  this.route('domain', { path: '/networking/domains/:domain_id' });

  this.route('testauto', { path: '/testauto'});

  this.route('droplet_create', { path: '/droplets/new'});

  this.route('droplet', { path: '/droplets/:droplet_id'}, function() {
    this.route('access');
    this.route('power');
    this.route('resize');
    this.route('snapshots');
    this.route('networking');
    this.route('kernel');
    this.route('backups');
    this.route('graphs');
    this.route('history');
    this.route('destroy');
    this.route('volumes');
    this.route('tags');
  });

  this.route('api', { path: '/settings/api' }, function () {
    this.route('tokens', function () {
      this.route('show', { path: '/:token_id' });
      this.route('new');
    });
    this.route('applications', function () {
      this.route('show', { path: '/:application_id' });
      this.route('details', { path: 'details/:application_id' });
      this.route('new');
    });
    this.route('access');

  });

  if (App.featureEnabled('objectStorage')) {
    this.route('spaces', { path: '/spaces' }, function () {
      this.route('show', { path: '/:bucket_id' }, function () {
        this.route('destroy');
        this.route('access');
      });
      this.route('new');
    });
  }

  this.route('oauth_v1', { path: '/v1/oauth' }, function() {
    this.route('authorize');
  });
  this.route('oauth', { path: '/oauth' }, function() {
    this.route('authorize');
  });

  this.route('images', function() {
    this.route('snapshots', function () {
      this.route('droplets');
      if(App.featureEnabled('volumeSnapshots')) {
        this.route('volumes');
      }
    });
    this.route('backups');
  });

  // lifeboat
  this.route('support', function() {
    this.route('tickets', function() {
      this.route('closed');
      this.route('ticket', {path: ':ticket_id'}, function() {});
      this.route('new');
    });
    this.route('suggestions');
  });

  this.route('notifications', { path: '/notifications'});

  this.route('settings', { path: '/settings' }, function() {
    this.route('profile', function() {
      this.route('edit');
      this.route('droplet_limit_increase');
      this.route('droplet_limit_auto_increase');
      this.route('deactivate');
    });
    if(App.featureEnabled('auroraBilling')) {
      this.route('billing');
    }
    this.route('security');
    this.route('referrals');
    this.route('notifications');

    this.route('team', function() {
      this.route('edit');
      this.route('new');
      this.route('invite');
      this.route('droplet_limit_increase');
    });
  });

  this.route('tag', { path: 'tags/:tag_name'});

  /* Barrier pages */
  this.route('admin_locked');
  this.route('archived_account');
  this.route('abuse_account');
  this.route('suspended');
  this.route('hold');

  if (!App.featureEnabled('auroraBilling')) {
    this.route('settings_sidebar', { path: 'settings/*path'});
  }

  if(App.featureEnabled('insightsDashboard')) {
    this.route('insights-dashboard', {
      path: '/insights'
    });
  }

  if (App.featureEnabled('monitoringPreferences')) {
    this.route('monitors', function() {
      this.route('add');
      this.route('edit', {path: '/:threshold_id'});
      if (App.featureEnabled('newMonitorCreate')) {
        this.route('new');
      }
    });
  }

  this.route('droplet_admin_locked', {path: '/droplet_admin_locked'});
  this.route('catch_all', { path: '/*path' });
});

let cloudTabs = config.APP.cloudTabs;
Object.keys(config.APP.featureFlippedCloudTabs).forEach(function(feature) {
  if(App.featureEnabled(feature)) {
    cloudTabs = _.extend(cloudTabs, config.APP.featureFlippedCloudTabs[feature]);
  }
});

let tabKeys = Object.keys(cloudTabs);
let tabKeysLen = tabKeys.length;

Ember.Route.reopen({
  beforeModel: function(){
    this._super.apply(this, arguments);

    let pathWithHash = window.location.href.replace(window.location.origin, '');
    let cloudRedirect, modelParam, match;

    function extractModel () {
      modelParam = match[1];
      return '';
    }

    for(let i =0; i < tabKeysLen; i++) {
      match = pathWithHash.match(new RegExp(tabKeys[i], 'i'));
      if(match) {
        cloudRedirect = cloudTabs[tabKeys[i]].replace(/\[\$1\]/g, extractModel);
        break;
      }
    }

    if(cloudRedirect) {
      if(modelParam) {
        this.transitionTo(cloudRedirect, modelParam);
      } else {
        this.transitionTo(cloudRedirect);
      }
    }
  }
});
