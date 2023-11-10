import { Router } from 'express';
import Joi from 'joi';
import faker from 'faker';
import requireLocalAuth from '../middleware/requireLocalAuth.js';
import { registerSchema } from '../services/validators.js';
import requireJwtAuth from '../middleware/requireJwtAuth.js';
import 'dotenv'

const router = Router();

router.post('/login', requireLocalAuth, (req, res) => {

 
  const token = req.user.generateJWT( (req.body?.appversion ? req.body.appversion : '' ));
  let me = req.user.toJSON();
  me.token = token;
  let headers = req.headers;

  if( !me.status ) {
    return res.status(500).json({
      'status' : 0,
      'message' : "You can not login. Contact with admin."
    });
  }

  if( headers['user-agent'] !== undefined ) {
    if(headers['user-agent'] == 'game_user' && me.role.id != 3) {

        return res.status(500).json({
          'status' : 0,
          'message' : "Only Customers can login in game."
        });
    }
  }
  
/*  if( me.token && me.role.id != 1) {
    return res.status(500).json({
                 'status' : 0,
                 'message' : "Already login in other system."
               });  
  }
*/

  // if(me.role.id == 3 && me.token ) {
  //   let updateTime = new Date(me.updatedAt);
  //   let currentTime = new Date();
        
  //       let diffInSeconds = ( currentTime - updateTime) / 1000;
    
  //       if( diffInSeconds < (60*30) ) {
  //         return res.status(500).json({
  //           'status' : 0,
  //           'message' : "Already login in other system."
  //         });  
  //       }
  // }
   res.json({ token, me });
});


//Print Game Login

router.post('/login/print', requireLocalAuth, (req, res) => {
  const token = req.user.generateJWT((req.body?.appversion ? req.body.appversion : '' ));
  let me = req.user.toJSON();
  me.token = token;
  const lcgame = process.env.PRINT_LC;
  const fiftycards = process.env.CARDSFIFTYTWO_GAME_PRINT;
  const spinToWinGame = process.env.SPIN_TO_WIN_GAME_ID_PRINT;

  let headers = req.headers;

  if( !me.status ) {
    return res.status(500).json({
      'status' : 0,
      'message' : "You can not login. Contact with admin."
    });
  }

  let checked = 1;
  if( me.games.includes(lcgame) || me.games.includes(fiftycards) || me.games.includes(spinToWinGame)) {
    checked = 0;
  }

  if(checked) {
    return res.status(500).json({
      'status' : 0,
      'message' : "You are not Allowed to play. Please Contact Admin"
    });
}
  

  if( headers['user-agent'] !== undefined ) {
    if(headers['user-agent'] == 'game_user' && me.role.id != 3) {

        return res.status(500).json({
          'status' : 0,
          'message' : "Only Customers can login in game."
        });
    }
  }

   res.json({ token, me });
});

/*
router.post('/register', async (req, res, next) => {
  const { error } = Joi.validate(req.body, registerSchema);
  if (error) {
    return res.status(422).send({ message: error.details[0].message });
  }

  const { email, password, name, username } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(422).send({ message: 'Email is in use' });
    }

    try {
      const newUser = await new User({
        provider: 'email',
        email,
        password,
        username,
        name,
        avatar: faker.image.avatar(),
      });

      newUser.registerUser(newUser, (err, user) => {
        if (err) throw err;
        res.json({ message: 'Register success.' }); // just redirect to login
      });
    } catch (err) {
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
});


*/

// logout
router.get('/logout', requireJwtAuth, (req, res) => {
  req.user.token = '.js';
  req.user.save();
  req.logout();
  res.status(200).json({
    'status' : 1,
    'message' : "Logged Out Successfully."
  });
});

export default router;
