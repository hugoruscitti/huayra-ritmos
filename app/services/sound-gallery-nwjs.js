import Ember from 'ember';

export default Ember.Service.extend({
  settings: Ember.inject.service(),
  recorder: Ember.inject.service(),
  sounds: {},
  categories: [],
  p5: null,

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

   function naturalSort (a, b) {
      var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
      sre = /(^[ ]*|[ ]*$)/g,
      dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
      hre = /^0x[0-9a-f]+$/i,
      ore = /^0/,
      i = function(s) { return (naturalSort.insensitive && (''+s).toLowerCase() || ''+s);},
      // convert all to strings strip whitespace
      x = i(a).replace(sre, '') || '',
      y = i(b).replace(sre, '') || '',
      // chunk/tokenize
      xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
      yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
      // numeric, hex or date detection
      xD = parseInt(x.match(hre)) || (xN.length !== 1 && x.match(dre) && Date.parse(x)),
      yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null,
      oFxNcL, oFyNcL;
      // first try and sort Hex codes or Dates
      if (yD) {
        if (xD < yD) {
          return -1;
        } else {
          if (xD > yD) {
            return 1;
          }
        }
      }

      // natural sorting through split numeric strings and default strings
      for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
        // find floats not starting with '0', string or 0 if not defined (Clint Priest)
        oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
        oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
        // handle numeric vs string comparison - number < string - (Kyle Adams)
        if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
        // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
        else if (typeof oFxNcL !== typeof oFyNcL) {
          oFxNcL += '';
          oFyNcL += '';
        }
        if (oFxNcL < oFyNcL) {
          return -1;
        }

        if (oFxNcL > oFyNcL) {
          return 1;
        }
      }
      return 0;
    }

    files.sort(naturalSort);

    files.forEach((name) => {
        //let path_to_filename = `sounds/${foldername}/${name}`;
        let path_to_filename = `${path}/${name}`;

      let title = name.replace('.wav', '');
      let audioClip = loadSound(path_to_filename);
      audioClip.connect(this.get('recorder').get('input'));

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
      this.set('p5', new p5());

      this.reloadCategories();

      this.getCategories().forEach((category) => {
        this.get('sounds')[category] = this.readSoundFilesFromFolder(category);
      });

      setTimeout(success, 1000);
    });

  },

});