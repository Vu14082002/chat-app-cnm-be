const mongoose = require('mongoose');

const PhonebookSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      ref: 'UserModel',
      required: [true, 'Please provide user id'],
    },
    contactId: {
      type: String,
      ref: 'UserModel',
      required: [true, 'Please provide contact id'],
    },
    alias: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Please provide name'],
    },
  },

  {
    collection: 'phonebook',
    timestamps: true,
  }
);

PhonebookSchema.index({ userId: 1, contactId: 1 }, { unique: true });

const PhonebookModel =
  mongoose.model.PhonebookModel || mongoose.model('PhonebookModel', PhonebookSchema);
module.exports = { PhonebookModel };
