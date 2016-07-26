var expect = require('chai').expect;
var mongooseSleuth = require('../index');

var helper = require('./testHelper');
var mongoose = helper.mongoose;

describe('mongooseSleuth', function() {

  // This test has little use.
  it('mongod version should be 3.2.6', function(done) {
    var admin = mongoose.connection.db.admin();
    admin.serverStatus(function(err, info) {
      if (err) return done(err)
      expect( info.version ).to.eq('3.2.6');
      done();
    });
  });

  describe('adding/removing spy', function() {

    beforeEach(function(done) {
      mongooseSleuth.config({
        mongoose: mongoose,
      });
      mongooseSleuth.start(done);
    });

    afterEach(function() {
      mongooseSleuth.stop();
    });

    describe('exec', function() {

      it('should add a spy', function() {
        expect( mongoose.Query.prototype.exec.name ).to.be.eql('vcrSpy');
      });

      it('should restore the original method', function() {
        mongooseSleuth.stop();
        expect( mongoose.Query.prototype.exec.name ).to.be.eql('exec');
      });

      it('should not add a second spy', function(done) {
        mongooseSleuth.start(function() {
          mongooseSleuth.stop();
          expect( mongoose.Query.prototype.exec.name ).to.be.eql('exec');
          done();
        });
      });
    });

  });

});
