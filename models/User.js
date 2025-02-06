const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    firstname: String,
    lastname: String,
    password: String,
    created_on: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
