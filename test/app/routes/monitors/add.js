import Ember from 'ember';
import AutoCompleteRoute from '../../routes/autocomplete';
import App from '../../app';

const MODAL_TRANSITION_TIME = 300;

export default AutoCompleteRoute.extend({
  controllerName: 'monitors.add-edit',

  renderTemplate: function() {
    this.render('monitors.addEdit', {
      into: 'application',
      outlet: 'modal'
    });

    // This is used to show list of monitors in the background of
    // addEdit modal.
    let modelForMonitors = this.modelFor('monitors.index');

    if (modelForMonitors) {
      // If list of monitors was loaded before (i.e. user have visited corresponding route)
      // render it as is immidiately.
      this.render('monitors.index', {
        into: 'monitors'
      });
    } else {
      // If list of monitors is empty (i.e. user landed on monitors/add or monitors/[:id])
      // wait until modal transition ends then pull the model and render the list.
      // Wait is introduced to avoid jitter.
      Ember.run.later(this, () => {
        this.render('monitors.index', {
          into: 'monitors',
          model: this.store.query('threshold', {page: 1})
        });
      }, MODAL_TRANSITION_TIME);
    }
  },

  enums: Ember.inject.service('insights-threshold-enums'),

  model() {
    return Ember.RSVP.hash({
      endpoints: this.get('enums.endpoints'),
      socialIdentities: this.store.findAll('social-identity')
    }).then(this.autoCompleteModel.bind(this));
  },

  setupController: function(controller, model) {
    this._super(controller, model);
    this.controller.set('modalTitle', 'Create alert policy');
  },

  actions: {
    loading: function(transition) {
      this.controllerFor('monitors').set('addLoading', true);
      transition.promise.finally(() => {
        this.controllerFor('monitors').set('addLoading', false);
      });
    },
    authenticate: function(provider) {
      this.get('torii').open(provider, {height: 630}).then(() => {
        this.store.findAll('social-identity');
      })
      .catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    }
  }
});
