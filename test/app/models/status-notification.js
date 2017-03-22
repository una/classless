import DS from 'ember-data';

const DAYS_IN_WEEK = 7;

export default DS.Model.extend({
  createdAt: DS.attr('date'),
  title: DS.attr(),
  updates: DS.attr(),

  acknowledge: function() {
    let expires = new Date();
    expires.setDate(expires.getDate() + DAYS_IN_WEEK);
    let utc = expires.toUTCString();
    let id = this.get('id');
    window.document.cookie = `status_event_${id}=hidden;expires=${utc};path=/`;
  },
  wasAcknowledged: function() {
    let cookies = '; ' + document.cookie;
    let parts = cookies.split('; status_event_' + this.get('id') + '=');
    if(parts.length === 2) { // eslint-disable-line no-magic-numbers
      return parts.pop().split(';').shift() === 'hidden';
    }
    return false;
  }.property()
});
