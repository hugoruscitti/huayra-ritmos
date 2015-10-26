import Ember from 'ember';

export default Ember.Controller.extend({
  pattern: Ember.inject.controller(),
  selectedSound: null,

  emptySelection: Ember.computed('selectedSound', function() {
    return (! this.get('selectedSound'));
  }),

  actions: {
    onSelectSound(sound_id) {
      this.set('selectedSound', sound_id);
    },
    accept() {
      var controller = this.get('pattern');
      controller.send('createNewTrackWithSound', this.get('selectedSound'));
      this.set('selectedSound', null);
    },
    acceptAndClose() {
      this.send('accept');
      this.send('close');
    },

    selectCategory(category) {
      alert("category " + category);
    }
  }
});
