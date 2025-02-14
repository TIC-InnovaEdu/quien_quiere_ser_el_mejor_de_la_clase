const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    local: {
      username: { type: String, required: true, trim: true, unique: true },
      password: { type: String, required: true },
      email: { type: String, required: true, trim: true, unique: true, lowercase: true },
      role: {
        type: String,
        enum: ["admin", "profesor", "estudiante"],
        default: "estudiante"
      },
    },
    puntos: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Método simple para validar contraseña
userSchema.methods.validatePassword = function (password) {
  return this.local.password === password;
};

module.exports = mongoose.model("User", userSchema, "login");
