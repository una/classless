import DS from 'ember-data';
import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    user: { key: 'user', deserialize: 'records', serialize: false },
    admin: { deserialize: 'records', serialize: false },
    replies: { serialize: false, deserialize: 'ids' }
  },

  extractMeta: function(store, type, payload) {
    if (payload) {
      let meta = {
        perPage: payload.per_page,
        pages: payload.pages,
        anyTickets: payload['any_tickets?'],
        unreadCount: payload.unread_count,
        unreadOpenTicketCount: payload.unread_open_ticket_count,
        unreadClosedTicketCount: payload.unread_closed_ticket_count
      };

      delete payload.per_page;
      delete payload.pages;
      delete payload['any_tickets?'];
      delete payload.unread_count;
      delete payload.unread_open_ticket_count;
      delete payload.unread_closed_ticket_count;

      return meta;
    }
  }
});
