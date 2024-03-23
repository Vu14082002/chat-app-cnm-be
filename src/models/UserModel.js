const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide name'],
        },
        phone: {
            type: String,
            required: [true, 'Please provide phone number'],
            unique: [true, 'phone number already exist'],
        },
        password: {
            type: String,
            required: [true, 'Please provide password'],
        },
        dateOfBirth: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
            default:
                'https://res.cloudinary.com/dttv3mbki/image/upload/v1704809257/chat-app-cnm-DB/y9x5eessbbrewmffzrwv.png',
        },
        background: {
            type: String,
            default:
                'https://res.cloudinary.com/dttv3mbki/image/upload/v1704809291/chat-app-cnm-DB/zrktnnusnsww7p7ef52r.jpg',
        },
        status: {
            type: String,
            default: 'offline',
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        qrCode: {
            type: String,
            require: true,
        },
    },
    {
        collection: 'users',
        timestamps: true,
    }
);
userSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const salt = await bcrypt.genSalt(4);
            const hashPassword = await bcrypt.hash(this.password, salt);
            this.password = hashPassword;
        }
        next();
    } catch (error) {
        next(error);
    }
});
userSchema.pre('findOneAndUpdate', async function (next) {
    try {
        this.set('updatedAt', new Date());
        next();
    } catch (error) {
        next(error);
    }
});
const UserModel = mongoose.model.UserModel || mongoose.model('UserModel', userSchema);
module.exports = { UserModel };
