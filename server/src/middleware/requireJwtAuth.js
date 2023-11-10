import passport from 'passport';

const requireJwtAuth = passport.authenticate('jwt', { session: false });

//  Check for token here match with database

export default requireJwtAuth;
