const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Username',
    required: true
  },
  puntos: {
    type: Number,
    required: true,
    default: 0
  },
  respuestasCorrectas: {
    type: Number,
    required: true,
    default: 0
  },
  totalPreguntas: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Score", scoreSchema);
