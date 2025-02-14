const LocalStrategy = require("passport-local").Strategy;
const User = require("../app/models/user");

module.exports = function (passport) {
  // Serialización para la sesión
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialización de la sesión
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Estrategia de registro
  passport.use(
    "local-register",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, username, password, done) => {
        try {
          // Verificar si el usuario ya existe
          const existingUser = await User.findOne({ "local.username": username });
          if (existingUser) {
            return done(null, false, req.flash("registerMessage", "El usuario ya existe"));
          }

          // Crear nuevo usuario
          const newUser = new User({
            local: {
              username: username,
              password: password, // Guardar contraseña sin hash
              email: req.body.email,
              role: req.body.email.includes("est.") ? "estudiante" : "profesor"
            },
            puntos: req.body.email.includes("est.") ? 0 : undefined
          });

          // Guardar usuario
          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          console.error("Error en registro:", error);
          return done(error);
        }
      }
    )
  );

  // Estrategia de login
  passport.use(
    "local-login",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, username, password, done) => {
        try {
          // Buscar usuario
          const user = await User.findOne({ "local.username": username });
          if (!user) {
            return done(null, false, req.flash("loginMessage", "Usuario no encontrado"));
          }

          // Validar contraseña directamente
          if (user.local.password !== password) {
            return done(null, false, req.flash("loginMessage", "Contraseña incorrecta"));
          }

          return done(null, user);
        } catch (error) {
          console.error("Error en login:", error);
          return done(error);
        }
      }
    )
  );
};
