/* globals moment: false */
import DS from 'ember-data';
import EventModel from '../models/event';

export default EventModel.extend({
  duration: DS.attr(),

  publicTypeName: function() {
    let type = this.get('type');
    // convert _ to space
    type = type.replace(/_/g, ' ');
    // change to title case/proper case
    return type.replace(/\w\S*/g, function(str) {
      return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
    });
  }.property('type'),

  executionTime: function() {
    let duration = this.get('duration');

    if(!isNaN(duration)) {
      let momentDate = moment.duration(duration, 'seconds'),
          seconds = momentDate.seconds(),
          minutes = momentDate.minutes(),
          hours = momentDate.hours(),
          days = momentDate.days(),
          result = [];

      if(days) {
        result.push(days + ' day' + ((days > 1) ? 's': ''));
      }

      if(hours) {
        result.push(hours + ' hour' + ((hours > 1) ? 's': ''));
      }

      if(minutes) {
        result.push(minutes + ' minute' + ((minutes > 1) ? 's': ''));
      }

      if(seconds) {
        result.push(seconds + ' second' + ((seconds > 1) ? 's': ''));
      }

      return result.join(' ');
    }
    return duration;
  }.property('duration')
});
