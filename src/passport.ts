import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage.js";

/**
 * LOCAL STRATEGY
 */
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return done(null, false, { message: "invalid_credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "invalid_credentials" });
      }

      return done(null, {
        id: user.id,
        username: user.username,
      });
    } catch (err) {
      return done(err);
    }
  })
);

/**
 * SESSION HANDLING
 */
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) return done(null, false);

    done(null, {
      id: user.id,
      username: user.username,
    });
  } catch (err) {
    done(err);
  }
});


export default passport;
