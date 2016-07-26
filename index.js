var fs = require('fs');
var path = require('path');

var config = {};
var restores = [];
var cassette = {};

// `config.cassetteDir` is the directory where cassettes are stored.
// `config.mode` either `record` or `playback`
// `config.mongoose` is the mongoose instance.
module.exports.config = function (options) {
  config.cassetteDir = options.cassetteDir;
  config.mode = process.env.VCR_MODE || options.mode;
  config.mongoose = options.mongoose;
}

module.exports.start = function(done) {

  // Spy on the exec funtion.
  addSpy(config.mongoose.Query.prototype, 'exec');

  if (config.mode === 'playback') {
    // preload the file.
    fs.readFile(getFullPath(), 'utf8', function(err, data) {
      if (err) return done(err.code === 'ENOENT' ? null : err);
      cassette = JSON.parse(data);
      done();
    });
  } else {
    done();
  }

}

module.exports.stop = function() {

  // Restore all the spied mthods to the original condition.
  restores.forEach(function(restore) {
    restore();
  });
  restores = [];

}

function addSpy(obj, method, func) {
  var realMethod = obj[method];

  // don't add a second spy.
  if (realMethod.name === 'vcrSpy') return;

  var spyMethod = obj[method] = function vcrSpy() {

    // dangerously specific to this implementation of mongoogse (4.4.14)
    var op = this.op;
    var cond = this.getQuery();

    switch (config.mode) {
      case 'record':
        var realResult = realMethod.apply(this, arguments);
        return record(op, cond, realResult);
        break;
      case 'playback':
        return playback(op, cond, arguments);
        break;
      default:
        throw new Error('mongooseVCR: unkown mode: ' + config.mode);
        break;
    }
  }

  // Unwrap the spy.
  spyMethod.restore = function() {
    obj[method] = realMethod;
  }

  // Take note of all restores.
  restores.push(spyMethod.restore);
}

function record(op, conditions, promise) {
  promise.then(function(results) {
    fs.readFile(getFullPath(), {flag: 'w+', encoding: 'utf8'}, function(err, data) {
      if (err) throw new Error(err);
      if (data) {
        // intentionally on file scope.
        cassette = JSON.parse(data);
      }
      var key = getCassetKey(op, conditions);
      cassette[key] = results;
      fs.writeFile(getFullPath(), JSON.stringify(cassette));
    });
  });
}

function playback(op, conditions, args) {
  return new Promise(function(resolve, reject) {
    var key = getCassetKey(op, conditions);
    var data = cassette[key];

    // dangerously specific to this implementation of mongoogse (4.4.14)
    var callback = args && args[0];

    if (data) {
      callback && callback(null, data);
      resolve(data);
    } else {
      var err = new Error('MongooseVCR: No data for query. Please run' +
                          ' `record` first.');
      callback && callback(err, undefined);
      reject();
    }
  });
}

// Get the key for a given query
function getCassetKey(op, conditions) {
  return op + '-' + JSON.stringify(conditions);
}

// get the full path to save / read cassettes
function getFullPath() {
  return path.join(config.cassetteDir, 'mongooseCassette.json');
}
