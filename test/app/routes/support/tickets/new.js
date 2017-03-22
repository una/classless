import Ember from 'ember';
import AutoCompleteRoute from '../../../routes/autocomplete';

const { getOwner } = Ember;

export default AutoCompleteRoute.extend({
  model: function () {
    return Ember.RSVP.hash({
      unsubmittedTicket: this.store.createRecord('ticket')
    }).then(this.autoCompleteModel.bind(this));
  },

  setupController: function (controller, model) {
    this._super(controller, model);
  },

  focusInput: function () {
    this._super();
    Ember.run.schedule('afterRender', () => {
      Ember.$('input.ticket-subject').focus();
    });
  }.on('init'),

  getTopicAndDescription: function () {
    let createController = getOwner(this).lookup('controller:support.tickets.new');
    return {
      topic: createController.get('topic'),
      description: createController.get('description')
    };
  },

  areFieldsValid: function () {
    let state = this.getTopicAndDescription();

    return state.topic && state.description;
  },

  actions: {
    createTicket: function () {
      if(!this.areFieldsValid()) {
        return;
      }
      let unsubmittedTicket = this.currentModel.unsubmittedTicket;
      let ticketAttrs = this.getTopicAndDescription();
      unsubmittedTicket.setProperties({
        topic: ticketAttrs.topic,
        content: ticketAttrs.description,
        viewedByUser: true
      });

      let dropletId = this.get('selectedDropletId');

      if (dropletId) {
        unsubmittedTicket.set('droplet', this.store.peekRecord('droplet', dropletId));
      }

      // set the submit button as disabled to prevent multiple submits
      Ember.$('button.ticket-submit-button').attr('disabled', 'disabled');
      unsubmittedTicket.save().then((ticket) => {
        // reset form fields
        getOwner(this).lookup('controller:support.tickets.new').setProperties({
          topic: '',
          description: ''
        });

        if(this.segment) {
          this.segment.trackEvent('Lifeboat submitted ticket', { id: ticket.get('id') });
        }

        this.controllerFor('support.tickets').set('model.meta.anyTickets', true);
        getOwner(this).lookup('route:support.tickets').refresh();
        this.transitionTo('support.tickets.ticket', ticket, {
          queryParams: {
            filter: 'open',
            page: 1
          }
        });
      });
    },
    checkIsValid: function() {
      let button = Ember.$('button.ticket-submit-button');

      // are there valid values for topic and content?
      if(this.areFieldsValid()) {
        // enable submit ticket button
        button.removeAttr('disabled');
      } else {
        // disable submit ticket button
        button.attr('disabled', 'disabled');
      }
    },
    onSelectDroplet: function(selected) {
      let dropletId = null;
      if(selected) {
        dropletId = selected.get('id');
      }
      this.set('selectedDropletId', dropletId);
    }
  },

  deactivate: function () {
    let ticket = this.currentModel.unsubmittedTicket;
    if (ticket.get('isNew')) {
      ticket.deleteRecord();
    }
  }
});
