/* globals moment: false */
/*
  Customize the momentjs relative time
  When using .fromNow() in moment, pass true
  to remove past 'ago' string

  Example:
    moment(this.get('date')).fromNow(true);
 */
export default {
  name: 'momentInit',
  initialize: function() {
    return moment.updateLocale('en', {
      relativeTime : {
        future: "in %s",
        past:   "%s ago",
        s:  "Just now",
        m:  "1 minute ago",
        mm: "%d minutes ago",
        h:  "1 hour ago",
        hh: "%d hours ago",
        d:  "Yesterday",
        dd: "%d days ago",
        M:  "1 month ago",
        MM: "%d months ago",
        y:  "1 year ago",
        yy: "%d years ago"
      }
    });
  }
};
