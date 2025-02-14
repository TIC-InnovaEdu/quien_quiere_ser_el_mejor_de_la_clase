const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true }, // 🔥 Número fijo en la ruleta (1-12)
  pregunta: { type: String, required: true },
  respuestas: { type: [String], required: true },
  correcta: { type: Number, required: true }
});

module.exports = mongoose.model("Question", questionSchema);
