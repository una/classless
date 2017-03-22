import Ember from 'ember';

export function firstNotificationSubject(params) {
  let pendingNotifications = params[0];
  return pendingNotifications[0].subject;
}

export default Ember.Helper.helper(firstNotificationSubject);
