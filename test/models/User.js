var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    trim: true,
  },
  age: Number,
});

var validateAge = function(done) {
  if (this.age < 0 || this.age > 150) {
    done(new Error('Age must be positive between 0 and 150'));
  } else {
    done();
  }
}

UserSchema.pre('save', validateAge);

module.exports = mongoose.model('User', UserSchema);
