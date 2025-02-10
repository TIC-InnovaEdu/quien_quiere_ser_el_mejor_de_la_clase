const express = require("express");
const User = require("../models/user");
const Question = require("../models/question");
const GameState = require("../models/gameState");
const Score = require("../models/score")
module.exports = (app, passport) => {
  // 🏠 RUTAS PRINCIPALES
  // Página de inicio
  app.get("/", (req, res) => {
    res.render("index");
  });

  // 🔐 AUTENTICACIÓN
  // Página de login
  app.get("/login", (req, res) => {
    res.render("login", {
      message: req.flash("loginMessage"),
    });
  });

  // Procesar formulario de login
  app.post(
    "/login",
    passport.authenticate("local-login", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    (req, res) => {
      // Redirección basada en rol
      if (req.user.local.role === "profesor") {
        res.redirect("/dashboard/profesor");
      } else if (req.user.local.role === "estudiante") {
        res.redirect("/dashboard/alumno");
      } else {
        res.redirect("/");
      }
    }
  );

  // Página de registro
  app.get("/register", (req, res) => {
    res.render("register", {
      message: req.flash("registerMessage"),
    });
  });

  // Procesar formulario de registro
  app.post(
    "/register",
    passport.authenticate("local-register", {
      successRedirect: "/",
      failureRedirect: "/register",
      failureFlash: true,
    })
  );

  // 🖥️ DASHBOARDS
  // Dashboard de profesor
  app.get("/dashboard/profesor", isLoggedIn, (req, res) => {
    res.render("dashboard/profesor", { user: req.user });
  });

  // Dashboard de alumno
  app.get("/dashboard/alumno", isLoggedIn, (req, res) => {
    res.render("dashboard/alumno", { user: req.user });
  });

  // 🚪 CIERRE DE SESIÓN
  app.get("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect("/");
    });
  });

  // 💯 GESTIÓN DE PUNTOS
  // Actualizar puntos del usuario
  app.post('/actualizar-puntos', isLoggedIn, async (req, res) => {
    try {
      const newPoints = req.body.puntos;
      if (typeof newPoints !== "number") {
        return res.status(400).json({ message: "Formato de puntos inválido" });
      }

      await User.findByIdAndUpdate(req.user._id, { puntos: newPoints });
      res.json({ message: "Puntos actualizados correctamente" });
    } catch (err) {
      console.error("Error al actualizar los puntos:", err);
      res.status(500).json({ message: "Error interno al actualizar puntos" });
    }
  });

  // 📋 GESTIÓN DE PREGUNTAS
  // API para obtener preguntas del juego
  app.get("/api/preguntas", async (req, res) => {
    try {
      const preguntas = await Question.find().sort({ numero: 1 });
      res.json(preguntas);
    } catch (error) {
      console.error("❌ Error obteniendo preguntas:", error);
      res.status(500).json({ message: "Error al obtener preguntas." });
    }
  });

  // Gestionar preguntas (vista para profesor)
  app.get("/profesor/preguntas", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
      return res.redirect("/dashboard/alumno");
    }

    try {
      const preguntas = await Question.find();
      res.render("dashboard/preguntas", { preguntas });
    } catch (err) {
      console.error("❌ Error obteniendo preguntas:", err);
      res.status(500).send("Error al obtener preguntas.");
    }
  });

  // Crear nueva pregunta
  app.post("/profesor/preguntas", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
      return res.redirect("/dashboard/alumno");
    }

    try {
      console.log("Datos recibidos:", req.body);

      // Encontrar el próximo número de pregunta disponible
      const ultimaPregunta = await Question.findOne().sort({ numero: -1 });
      const nuevoNumero = ultimaPregunta ? ultimaPregunta.numero + 1 : 1;

      // Validaciones
      if (nuevoNumero > 20) {
        return res.status(400).send("Máximo de preguntas alcanzado (20).");
      }

      // Crear nueva pregunta
      const nuevaPregunta = new Question({
        numero: nuevoNumero,
        pregunta: req.body.pregunta,
        respuestas: req.body.respuestas.split(",").map(r => r.trim()),
        correcta: parseInt(req.body.correcta, 10)
      });

      await nuevaPregunta.save();

      res.redirect("/profesor/preguntas");
    } catch (err) {
      console.error("❌ Error agregando pregunta:", err);

      if (err.code === 11000) {
        return res.status(400).send("Ya existe una pregunta con ese número.");
      }

      res.status(500).send(`Error al agregar pregunta: ${err.message}`);
    }
  });
  // Obtener pregunta para edición
  app.get("/profesor/preguntas/:id", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
      return res.redirect("/dashboard/alumno");
    }

    try {
      const pregunta = await Question.findById(req.params.id);
      res.json(pregunta);
    } catch (err) {
      console.error("Error obteniendo pregunta:", err);
      res.status(500).json({ message: "Error al obtener la pregunta." });
    }
  });

  // Editar pregunta
  app.post("/profesor/preguntas/editar/:id", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
      return res.redirect("/dashboard/alumno");
    }

    try {
      const { pregunta, respuestas, correcta } = req.body;
      await Question.findByIdAndUpdate(req.params.id, {
        pregunta,
        respuestas: respuestas.split(","),
        correcta: parseInt(correcta),
      });

      res.redirect("/profesor/preguntas");
    } catch (err) {
      console.error("Error actualizando pregunta:", err);
      res.status(500).send("Error al actualizar la pregunta.");
    }
  });

  // Eliminar pregunta
  app.post("/profesor/preguntas/eliminar/:id", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
      return res.redirect("/dashboard/alumno");
    }

    try {
      await Question.findByIdAndDelete(req.params.id);
      res.redirect("/profesor/preguntas");
    } catch (err) {
      console.error("Error eliminando pregunta:", err);
      res.status(500).send("Error al eliminar la pregunta.");
    }
  });

  // 📊 PUNTAJES
  // Ver puntajes de estudiantes
  app.get("/profesor/puntajes", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
        return res.redirect("/dashboard/alumno");
    }

    try {
        const estudiantes = await User.find({ "local.role": "estudiante" })
            .select("local.username puntos")
            .sort({ puntos: -1 }); // Agregamos sort con -1 para orden descendente
        res.render("dashboard/puntajes", { estudiantes });
    } catch (err) {
        console.error("Error obteniendo puntajes:", err);
        res.status(500).send("Error al obtener puntajes.");
    }
});
  // 🎮 ESTADO DEL JUEGO
  // Obtener estado del juego
  app.get("/api/estado-juego", async (req, res) => {
    try {
      let gameState = await GameState.findOne();
      if (!gameState) {
        gameState = new GameState({ isActive: false });
        await gameState.save();
      }
      res.json({ isActive: gameState.isActive });
    } catch (error) {
      console.error("❌ Error obteniendo el estado del juego:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Activar/desactivar juego
  app.post("/profesor/estado-juego", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
      return res.status(403).json({ message: "No autorizado" });
    }

    try {
      const totalPreguntas = await Question.countDocuments();

      if (req.body.isActive && totalPreguntas < 12) {
        return res.status(400).json({
          message: `No puedes activar el juego. Faltan ${12 - totalPreguntas} preguntas.`,
          preguntasFaltantes: 12 - totalPreguntas,
        });
      }

      let gameState = await GameState.findOne();
      if (!gameState) {
        gameState = new GameState({ isActive: req.body.isActive });
      } else {
        gameState.isActive = req.body.isActive;
      }

      await gameState.save();
      res.json({ message: "Estado del juego actualizado", isActive: gameState.isActive });
    } catch (error) {
      console.error("❌ Error actualizando el estado del juego:", error);
      res.status(500).json({ message: "Error interno del servidor", error: error.toString() });
    }
  });

  // 🔒 MIDDLEWARE DE AUTENTICACIÓN
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ message: "No autorizado" });
    }

    res.redirect("/login");
  }
   // Guardar puntaje al finalizar juego
   app.post("/api/guardar-puntaje", isLoggedIn, async (req, res) => {
    console.log("Recibida petición para guardar puntaje");
    console.log("Datos recibidos:", req.body);
    console.log("Usuario:", req.user);

    try {
        const { puntos, respuestasCorrectas, totalPreguntas } = req.body;

        // Validaciones
        if (!req.user || !req.user._id) {
            console.log("Error: Usuario no autenticado");
            return res.status(401).json({
                message: "Usuario no autenticado correctamente"
            });
        }

        if (typeof puntos !== 'number' ||
            typeof respuestasCorrectas !== 'number' ||
            typeof totalPreguntas !== 'number') {
            console.log("Error: Datos inválidos", { puntos, respuestasCorrectas, totalPreguntas });
            return res.status(400).json({
                message: "Datos inválidos",
                received: { puntos, respuestasCorrectas, totalPreguntas }
            });
        }

        // Crear nuevo registro de score
        const nuevoScore = new Score({
            userId: req.user._id,
            puntos,
            respuestasCorrectas,
            totalPreguntas
        });

        console.log("Intentando guardar score:", nuevoScore);
        await nuevoScore.save();
        console.log("Score guardado exitosamente");

        // Actualizar puntos totales del usuario
        console.log("Actualizando puntos del usuario");
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { puntos: puntos }
        });
        console.log("Puntos de usuario actualizados");

        res.json({
            message: "Puntaje guardado correctamente",
            puntajePartida: nuevoScore
        });

    } catch (error) {
        console.error("Error completo al guardar puntaje:", error);
        res.status(500).json({
            message: "Error al guardar puntaje",
            error: error.message
        });
    }
});
  // Obtener historial de puntajes del usuario
  app.get("/api/mi-historial", isLoggedIn, async (req, res) => {
    try {
      const historial = await Score.find({ userId: req.user._id })
        .sort({ fecha: -1 })
        .limit(10);

      res.json(historial);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({ message: "Error al obtener historial" });
    }
  });

  // Ver ranking (top 10)
  app.get("/api/ranking", async (req, res) => {
    try {
        const ranking = await User.find({ "local.role": "estudiante" })
            .sort({ puntos: -1 }) 
            .limit(10)
            .select("local.username puntos");

        res.json(ranking);
    } catch (error) {
        console.error("Error al obtener ranking:", error);
        res.status(500).json({ message: "Error al obtener ranking" });
    }
});

  // Vista de estadísticas para profesor
  app.get("/profesor/estadisticas", isLoggedIn, async (req, res) => {
    if (req.user.local.role !== "profesor") {
      return res.redirect("/dashboard/alumno");
    }

    try {
      // Obtener estadísticas generales
      const estadisticas = await Score.aggregate([
        {
          $group: {
            _id: "$userId",
            partidasJugadas: { $sum: 1 },
            puntajePromedio: { $avg: "$puntos" },
            respuestasCorrectasTotal: { $sum: "$respuestasCorrectas" }
          }
        },
        {
          $lookup: {
            from: "login", // Tu colección de usuarios
            localField: "_id",
            foreignField: "_id",
            as: "usuario"
          }
        }
      ]);

      res.render("dashboard/estadisticas", { estadisticas });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).send("Error al obtener estadísticas");
    }
  });
  app.get("/api/scores/history/:studentId", isLoggedIn, async (req, res) => {
    try {
        const historial = await Score.find({ userId: req.params.studentId })
            .sort({ fecha: -1 })
            .limit(10);
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ message: "Error al obtener historial" });
    }
});

};
