import App from '../../app';
import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    let droplet = this.modelFor('droplet');

    // The SG backend is WIP, so we don't have the ability to embed the SGs in
    // the droplet model. For now, we'll just do it manually here.
    if (App.featureEnabled('securityGroups')) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        let params = {droplet_id: droplet.get('id')};
        this.store.query('securityGroup', params).then((securityGroups) => {
          droplet.set('securityGroups', securityGroups);
          resolve(droplet);
        }).catch(reject);
      });
    }

    return droplet;
  }
});
