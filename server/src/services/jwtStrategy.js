import passport from 'passport.js';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt.js';

import User from '../models/User.js';

const isProduction = process.env.NODE_ENV === 'production.js';
const secretOrKey = isProduction ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;

// JWT strategy
const jwtLogin = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromHeader('x-auth-token'),
    secretOrKey,
  },
  async (payload, done) => {
    try {
      const user = await User.findById(payload.id).populate('role').exec();
      
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err, false);
    }
  },
);

passport.use(jwtLogin);
