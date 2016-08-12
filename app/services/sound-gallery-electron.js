import Ember from 'ember';
import naturalSort from '../naturalSort';
import {service} from '../service';

export default Ember.Service.extend({
  settings: service('settings'),
  recorder: Ember.inject.service(),
  sounds: {},
  categories: [],

  getSoundsByCategory(category) {
    return this.get('sounds')[category];
  },

  getSoundsByCategoryAsList(category) {
    var dictionary = this.getSoundsByCategory(category);

    var values = Object.keys(dictionary).map(function(key){
      return dictionary[key];
    });

    return values;
  },

  getCategories() {
    return this.get('categories');
  },

  getAudioClip(audioThing){
   var audioClip;

   if(typeof(audioThing) === "string"){
    var category = audioThing.split('/')[0];
    var filename = audioThing.split('/')[1];
    audioClip = this.get('sounds')[category][filename].audioClip;
   }
    else{
     audioClip = audioThing.audioClip;
   }
   return audioClip;
  },

  readSoundFilesFromFolder(foldername) {
    var fs = window.requireNode('fs');
    var sounds = {};
    var path = "";
    var basePath = this.getSoundPath();
    var userPath = this.getSoundUserPath();

    if (foldername) {
      if( fs.existsSync(`${basePath}/${foldername}`) ){
        path = `${basePath}/${foldername}`;
      }
      else if( fs.existsSync(`${userPath}/${foldername}`) ){
        path = `${userPath}/${foldername}`;
      }
   }

   var files = fs.readdirSync(path).filter((e) => {
     return e.indexOf('.wav') > 0;
   });

    files.sort(naturalSort);

    files.forEach((name) => {
        let path_to_filename = `${path}/${name}`;

      let title = name.replace('.wav', '');
      let audioClip = loadSound(path_to_filename);

      sounds[name] = {id: name,
                      title: title,
                      category: foldername,
                      audioClip: audioClip,
                      };
    });

    return sounds;
  },

  getSoundPath() {
    var prefix = this.get('settings').getPrefix();
    return `${prefix}sounds`;
  },
  getSoundUserPath() {
    return this.get('settings').getUserPrefix;
  },

  reloadCategories() {
    var fs = window.requireNode('fs');
    var path = window.requireNode('path');
    var basePath = this.getSoundPath();
    var userPath = this.getSoundUserPath();
    function isFolder(file) {
      return fs.statSync(path.join(basePath, file)).isDirectory();
    }
    function isUserFolder(file) {
      return fs.statSync(path.join(userPath, file)).isDirectory();
    }

    fs.readdirSync(basePath).filter(isFolder).forEach((e) => {
      this.get('categories').pushObject(e);
    });
    fs.readdirSync(userPath).filter(isUserFolder).forEach((e) => {
      this.get('categories').pushObject(e);
    });
  },

  loadSounds() {

    this.set('sounds', {});
    this.set('categories', []);

    return new Ember.RSVP.Promise((success) => {

      this.reloadCategories();

      this.getCategories().forEach((category) => {
        this.get('sounds')[category] = this.readSoundFilesFromFolder(category);
      });

      setTimeout(success, 1000);
    });

  },

});