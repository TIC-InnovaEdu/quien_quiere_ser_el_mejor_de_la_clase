const mongoose = require("mongoose");

const gameStateSchema = new mongoose.Schema({
  isActive: { type: Boolean, required: true, default: false } // Estado del juego
});

module.exports = mongoose.model("GameState", gameStateSchema);
