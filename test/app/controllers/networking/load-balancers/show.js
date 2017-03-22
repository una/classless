import App from '../../../app';
import BaseController from '../../base';
import setTlsPassthrough from '../../../utils/set-tls-passthrough';
import convertPortsToInt from '../../../utils/convert-ports-to-int';

export default BaseController.extend({
  trackPageName: 'Show Load Balancer',
  isEditing: false,

  isCreating: function() {
    return this.get('model.state') === 'NEW';
  }.property('model.state'),

  isError: function() {
    return this.get('model.state') === 'ERROR';
  }.property('model.state'),

  isEditable: function() {
    return !this.get('isRenaming') && this.get('model.state') === 'ACTIVE';
  }.property('model.state'),

  getForwardingRules: function() {
    const rules = setTlsPassthrough(this.get('model.forwardingRules'));

    return convertPortsToInt(rules);
  },

  actions: {
    renameLoadBalancer: function (newName, oldName) {
      const loadBalancer = this.get('model');

      this.setProperties({
        isRenaming: true,
        isEditing: false,
        'model.name': newName
      });

      // For tagged LBs, targetDroplets needs to be empty for the update request
      // to work, because the backend expects either a tag *or* an array of droplets:
      // https://github.internal.digitalocean.com/digitalocean/cthulhu/blob/24d3dd8aacb8ae9e2c7444d22c6ae5ea1fd2de84/docode/src/teams/high_avail/load-balancers/api/validate.go#L269
      // targetDroplets is then re-populated by the backend.
      if (loadBalancer.get('tag') !== '') {
        const dropletCount = loadBalancer.get('backendDropletCount');

        loadBalancer.setProperties({
          targetDroplets: [],
          // This prevents the droplet count from appearing as 0 during the update.
          backendDropletCount: dropletCount
        });
      }

      // This prevents a "Certificate not found" error for LBs with TLS
      // passthrough-enabled forwarding rules.
      loadBalancer.set('forwardingRules', this.getForwardingRules());

      loadBalancer.save()
        .then(() => {
          App.NotificationsManager.show(
            'Your Load Balancer has been renamed.',
            'notice'
          );
        })
        .catch((err) => {
          this.set('model.name', oldName);
          this.errorHandler(err, 'Renaming droplet');
        })
        .finally(() => {
          this.set('isRenaming', false);
        });
    },

    undoRenameLoadBalancer: function () {
      this.set('isEditing', false);
    },

    editLoadBalancerName: function () {
      if (this.get('isEditable')) {
        this.set('isEditing', true);
      }
    }
  }
});
