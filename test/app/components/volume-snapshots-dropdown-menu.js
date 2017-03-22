import SlideOutDropdownMenu from '../components/slide-out-dropdown-menu';

export default SlideOutDropdownMenu.extend({
  actions: {
    deleteSnapshot: function () {
      let snapshot = this.get('actionParams');
      this.sendAction('deleteSnapshot', snapshot);
    }
  }
});
