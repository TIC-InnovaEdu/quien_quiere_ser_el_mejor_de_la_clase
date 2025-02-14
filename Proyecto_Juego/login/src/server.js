const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const { url } = require("./config/database");

// ✅ Conexión a MongoDB
mongoose
  .connect(url)
  .then(() => console.log("✅ Conectado exitosamente a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

require("./config/passport")(passport);

app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ✅ Middlewares necesarios
app.use(morgan("dev"));
app.use(cookieParser());

// 🔥 **Solución: Asegurar que Express procese JSON**
app.use(express.json()); // 🚀 **Esta línea es crucial para arreglar el problema**
app.use(express.urlencoded({ extended: false })); // ✅ Para formularios HTML

app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ✅ Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// ✅ Cargar rutas
require("./app/routes/routes")(app, passport);

// ✅ Iniciar servidor
app.listen(app.get("port"), () => {
  console.log("🚀 Servidor corriendo en el puerto", app.get("port"));
});
