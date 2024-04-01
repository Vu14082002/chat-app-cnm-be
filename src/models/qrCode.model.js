const mongoose = require('mongoose');
const { Schema } = mongoose;

const qrCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  connectedDeviceId: {
    type: Schema.Types.ObjectId,
    ref: 'connectedDevices',
  },
  lastUsedDate: { type: Date, default: null },
  isActive: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const QRCodeModel = mongoose.model.QRCodeModel || mongoose.model('QRCodeModel', qrCodeSchema);
module.exports = { QRCodeModel };
