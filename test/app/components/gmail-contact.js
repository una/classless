import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    'isSelected:gmail-contact-selected',
    'isSelectable:gmail-contact-selectable:gmail-contact-disabled'
  ],
  classNames: ['gmail-contact'],

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, this.updateContact);
  }.on('didInsertElement'),

  updateContact: function() {
    let nameDisplay, emailDisplay, isSelectable;

    if(this.get('fullName') && this.get('fullName.length') > 0) {
      nameDisplay = this.get('fullName');
    } else {
      nameDisplay = this.get('email');
    }

    switch(this.get('label')) {
      case 'invited':
        emailDisplay = 'Already Invited';
        isSelectable = false;
        break;
      case 'registered':
        emailDisplay = 'Already a DigitalOcean User';
        isSelectable = true;
        break;
      default:
        emailDisplay = nameDisplay !== this.get('email') ? this.get('email') : '';
        isSelectable = true;
        break;
    }

    this.setProperties({
      nameDisplay: nameDisplay,
      emailDisplay: emailDisplay,
      isSelectable: isSelectable
    });
  }.observes('fullName', 'email', 'label')
});
