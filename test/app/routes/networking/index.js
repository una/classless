import Ember from 'ember';

export default Ember.Route.extend({
	titleToken: 'Networking',
	beforeModel: function() {
		this.transitionTo('networking.domains');
	}
});
