var expect = require('chai').expect;
var mongooseSleuth = require('../index');
var fixtures = require('pow-mongoose-fixtures');

var helper = require('./testHelper');
var mongoose = helper.mongoose;
var User = helper.User;

describe('record', function() {
  before(function(done) {
    mongooseSleuth.config({
      mode: 'record',
      mongoose: mongoose,
      cassetteDir: __dirname + '/cassettes/',
    });


    console.log(require('mongoose').connection.db);
    fixtures.load({
      User: [
        { name: 'Maeby' },
        { name: 'George Michael' }
      ]
    }, done);
  });

  beforeEach(function(done) {
    mongooseSleuth.start(done);
  });

  afterEach(function() {
    mongooseSleuth.stop();
  });

  it('should save data', function(done) {

    User.find({name:'Maeby'}).exec(function(err, data) {
      expect( err ).to.not.be.ok();
      expect( data ).to.be.eql('five');
    });
    // console.log(mongoose.connection.db.dropDatabase(done));
  });

});
