var mongoose = require('mongoose');

var uri = 'mongodb://localhost/mongoose_sleuth_test';
mongoose.connect(uri);
var User = require('./models/User');

before(function(done) {
  mongoose.connection.on('open', done);
});

after(function(done) {
  mongoose.connection.close(done);
});

module.exports = {
  mongoose: mongoose,
  User: User,
}
