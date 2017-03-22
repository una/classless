import DropdownMenu from '../components/dropdown-menu';

export default DropdownMenu.extend({
  classNameBindings: ['isOpen:open'],

  onInit: function () {
    this.classNames = (this.classNames || []).concat(['distro-version Dropdown']);
  }.on('init'),

  setParentAsOpen: function() {
    this.$().parent().toggleClass('open', this.get('isOpen'));
  }.observes('isOpen'),

  actions: {
    selectImage: function(distro, image) {
      this.clickAway();
      this.sendAction('action', distro, image);
    }
  }
});

