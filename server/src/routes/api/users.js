import { response, Router } from 'express';
import Joi from 'joi';
import { addUserSchema, addUsersSchema } from '../../services/validators.js';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import User from '../../models/User.js';
import Role from '../../models/Role.js';
import GameHistory from '../../models/GameHistory.js';
import Betting from '../../models/Betting.js';
import Transaction from '../../models/Transaction.js';
import fileGetContents from 'file-get-contents'
import { checkpermission, verifyToken, treeUnderUser, getAllGames, generateReferCode, getDisplayId, settingsData } from '../../helper/common.js';
import Otp from '../../models/Otp.js';
import requestIp from 'request-ip';
import 'dotenv';
import LockedDevices from '../../models/LockedDevices.js';
const env = process.env;

// import logger from '../../services/logger.js';

const router = Router();
import mongoose from 'mongoose';
  const  ObjectId  = mongoose.Schema.Types.ObjectId;
let mansImages = [0,1,2,4,6,7,9,11,12,14];

// requireJwtAuth
router.get('/leaderboard',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // Default response
  let response = {
    status: 0,
    message: 'Issue in Leader board.',
  };

  try {
    let users = await User.find({winning:{$gt:0}}, 'name winning image').sort({winning:-1}).limit(10);

    response.status = 1;
    response.message = 'With data.js';
    response.users = users;

    return res.status(response.status == 1 ?  200 : 500).json(response);

  } catch (err) {
    
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    return res.status(500).json(response);
  }

  


});

/**
 * Get current user coins.
 */
router.get('/usercoins', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'usercoins');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    const userId = req.user.id;

    let response = {};
    const coins = await User.findById(userId, {
      coins: 1,
      _id: 0,
    }).exec();

    response.coins = coins.coins;
    response.betting = 0;

    let d = new Date();

    const gameHistory = await GameHistory.find({
      game: ObjectId(req.user.current_game),
      start: {
        $lte: d.toISOString(),
      },
      end: {
        $gt: d.toISOString(),
      },
    }).exec();

    if (gameHistory.length) {
      let gameHistoryId = gameHistory[0]._id;

      // Get the current betting sum
      const agg = await Betting.aggregate([
        {
          $match: {
            user: ObjectId(userId),
            game_history: ObjectId(gameHistoryId),
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ]).exec();

      if (agg.length > 0) {
        if (agg[0].total !== undefined) {
          response.betting = agg[0].total;
        }
      }
    }

    res.json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString(),
    });
  }
});

router.post('/resetlockedmoney', requireJwtAuth, async (req, res) => {
  
  let response = {
    status : 0,
    message : 'Issue in reset locked money'
  }
  
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'resetlockedmoney');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    const userId = req.body.user_id;

    const userObject = await User.findById(userId, 'lockedmoney');

    if(!userObject) {
      response.message = 'User not found given user id.js';
      return res.status(500).json(response);
    }
    userObject.lockedmoney = 0;
    await userObject.save();
    response.status = 1;
    response.message ="Locked amount has been reset."
    return res.json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    response.status = 0;
    res.status(500).json(response);
  }
});

//
router.get('/khuljasimsim', requireJwtAuth, async (req, res) => {

  let response = {
    'status' : 0,
    'message' : 'Issue in khulja simsim request'
  }

  try {

    //req.user = await User.findOne({"username" : "p1219"});

    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    let filters = {};
    
    filters.createdAt = {
      $gte: start.toISOString(),
      $lte: end.toISOString()
    }

    filters.toUser = ObjectId(req.user.id);

    filters.type = {$eq: 'ADD'};

    filters.comment = 'kuljasimsim.js';

   let totalWidthDraw = await Transaction.find(filters);

   if(totalWidthDraw.length > 0) {
     response.message = 'We have allowed 1 withdraws on daliy bases.'
     return res.json(response);
   }

  
  let max = await settingsData('teempatti_khulja_simsim');

  max = parseFloat(max);

  let min = 1;

  let simsimAmount = parseFloat((Math.random() * (max - min) + min).toFixed(2));

  let cuUser = await User.findById(req.user.id);
  cuUser.coins = cuUser.coins + simsimAmount;

  await cuUser.save();

  let transactions = [];

  let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

  transactions.push({
          type: "ADD",
          toUser: cuUser.id,
          fromUser: ObjectId(fromUser.id),
          trans_coins: parseFloat(simsimAmount),
          comment: 'kuljasimsim',
          remaining_coins: cuUser.coins
      });

      if(transactions.length) {

        fromUser.coins = fromUser.coins - simsimAmount;
        await fromUser.save();

        await Transaction.insertMany(transactions);

        response.status = 1;
        response.amount = simsimAmount;
        response.message = 'Amount created.js';
        response.coins = cuUser.coins;
      }

      return res.json(response);

    } catch (err) {
      logger.error(err.message, {metadata: err});
      response.message = err.message || err.toString();
      res.status(500).json(response);
    }
});



/**
 * Update profile
 */
 router.post('/updateprofile', requireJwtAuth, async (req, res) => {
  
  // Verify token
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // Default response
  let response = {
    status: 0,
    message: 'Issue in update user request',
  };

  try {
    
    // Get user by req.
    let user = req.user;

   
    
      let userUp = await User.findOne(
        { _id: user.id }).exec();
   
      if (!userUp) {
          response.message = "This user does not exists with us.";
          return res.status(500).send({
            response: response,
          });
      }
    
      let email =  req.body.email;
      let name = req.body.name;
      let image = req.body.image;
      
      let save = 0;
      if(image) {
        save = 1;
        userUp.image = image;
      }

      if(name) {
        save = 1;
        userUp.name = name;
      }
      
      if(email) {
        save = 1;
        userUp.email = email;
      }

      if(save) {
        await userUp.save();
      }
      
    response = {
      status: 1,
      message: 'Updated user',
    };

    res.status(200).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in update user request.',
    });
  }
});

// Get user information from token
router.get('/getuser', requireJwtAuth, async (req, res) => {

  // Verify token
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let response = {
    'status':1,
    'message': '',
    'user': req.user
  }

  return res.json(response);

});

/**
 * Post request to get all users data by roles
 */
router.post('/byrole', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'byrole');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    let roleId = req.body.role;

    let filters = {};
    let userId = req.body.userid;
    let usersname = req.body.searchusername;
    let perPage = 20, page = parseInt(req.body.currentPage);

    // let skip = page * limit;

    //req.user.id;
    const currentUserId = req.user.id;
    const user = req.user;
    const currentUserRole = user.role.id;
    let allChild;
/* 
    if (currentUserRole == 2) {
      allChild = await treeUnderUser(currentUserId);

      filters._id = { $in: allChild };
    }

    if (roleId == 2 || roleId == 3) {
      const role = await Role.findOne({
        id: roleId,
      });
      filters.role = role._id;
    }

   
    if (currentUserRole == 1) {
      if (userId) {
        let userCheck = await User.findById({ _id: userId }).populate('role').exec();
        if (userCheck.role.id == 3) {
          filters._id = userCheck;
        } else if (userCheck.role.id == 2) {
          allChild = await treeUnderUser(userId);

          filters._id = { $in: allChild };
        }
      }
    }


    if (usersname && user.role.id != 3) {

      let selectUser = await User.findOne({
        'username': usersname
      }, '_id').exec();

      if (!selectUser) {
        filters = {
          $or:[{phone: usersname},{email:username}]
        }
        //response.message = 'Please try with different username. This name does not exists.js';
        //return res.send(response);
      }
      if (selectUser) {


        if (user.role.id == 2) {

          if (!allChild.includes(selectUser.id)) {

            response.message = 'user does not exist under this agent.js';
            return res.status(500).json({
              'message': 'user not found'
            });
          }
        }

        filters = {
          _id: ObjectId(selectUser.id)
        }

      }
    }
*/
    if(usersname) {
      filters = {
        $or: [{username:usersname},{phone: usersname},{email:usersname}]
      }
    } else {
      filters.username = { $ne: 'masteradmin' };
    }
    
    filters.boat = {$ne: true};

    if( req.body.startDate != undefined && req.body.endDate != undefined ) {
      let start = new Date(req.body.startDate);
      let end = new Date(req.body.endDate);

      filters.createdAt = {
        $gte: start.toISOString(),
        $lte: end.toISOString()
     }
    }


    const users = await User.find(filters).limit(perPage).skip(page * perPage)
      .sort({
        updatedAt: 'desc',
      })
      .populate('role')
      .populate('parent').populate('current_game','name');

    res.json({ roleId, users })

    // res.json({
    //   users: users.map((m) => {
    //     return m.toJSON();
    //   }),
    // });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString(),
    });
  }
});

/**
 * Post request to get all users data by roles
 */
 router.get('/allagents', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

    try {
    let filters = {};
    
    const role = await Role.findOne({
        id: 2,
      });
      filters.role = role._id;
    
    //req.user.id;
    const currentUserId = req.user.id;
    const user = req.user;
    const currentUserRole = user.role.id;
    let allChild;

    if (currentUserRole == 2) {
      allChild = await treeUnderUser(currentUserId);

      filters._id = { $in: allChild };
    }

    filters.username = { $ne: 'masteradmin' }

    const users = await User.find(filters)
      .sort({
        updatedAt: 'desc',
      });

    res.json({ users })

    // res.json({
    //   users: users.map((m) => {
    //     return m.toJSON();
    //   }),
    // });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString(),
    });
  }
});

/**
 *
 */
router.get('/gamehistory/:gamehistoryid', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'gameHistory');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    status: 0,
    message: 'Issue in user game history',
  };

  const user = req.user;

  if (user.role.id != 1) {
    return res.status(500).json({ status: 0, message: 'Restricted area only for admin' });
  }

  try {
    const currentUserRole = user.role.id;

    let gameHisotyId = req.params.gamehistoryid;
    if (gameHisotyId) {
      if (currentUserRole == 1) {
        let gameHistory = await GameHistory.findById(gameHisotyId).exec();

        response.totalBetting = gameHistory.total_betting;
        response.totalWinning = gameHistory.total_winning;
        response.start = gameHistory.start;
        response.end = gameHistory.end;

        let bettings = await Betting.find({
          game_history: ObjectId(gameHisotyId),
          status: 'completed',
        })
          .populate('user')
          .exec();

        response.users = {};

        for (let singleBet of bettings) {
          if (response.users[singleBet.user.username] === undefined) {
            response.users[singleBet.user.username] = {};
            response.users[singleBet.user.username]['username'] = singleBet.user.username;
          }

          response.users[singleBet.user.username]['userid'] = singleBet.user._id;

          if (response.users[singleBet.user.username]['betamount'] !== undefined) {
            response.users[singleBet.user.username]['betamount'] =
              response.users[singleBet.user.username]['betamount'] + singleBet.amount;
          } else {
            response.users[singleBet.user.username]['betamount'] = singleBet.amount;
          }

          if (singleBet.win_status) {
            if (response.users[singleBet.user.username]['winning'] !== undefined) {
              response.users[singleBet.user.username]['winning'] =
                response.users[singleBet.user.username]['winning'] + singleBet.winning;
            } else {
              response.users[singleBet.user.username]['winning'] = singleBet.winning;
            }
          }
        }

        response.users = Object.values(response.users);
        response.message = '.js';
        response.status = 1;
      } else {
        response.message = 'This area is restricted for other users.js';
      }
    } else {
      response.message = 'Please provide the game history id.js';
    }

    res.status(response.status == 1 ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    // Set error message
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});

router.get('/me', requireJwtAuth, (req, res) => {
  let permission = checkpermission(req.user.role.id, 'userMe');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const me = req.user;
  res.json({ me });
});

// Users Inactive for 7 days
router.get('/inactive/:currentPage', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'inactiveUser');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    const user = await req.user.getUserWithRole(req.user);

    if (user.role.id != 1) {
      return res.status(500).json({ status: 0, message: 'Restricted area only for admin' });
    }

    let backDate = new Date(new Date().setDate(new Date().getDate() - 7));
    let perPage = 20, page = parseInt(req.params.currentPage);

    const inacUser = await User.find(
      {
        updatedAt: {
          $lte: backDate,
        },
      },
      {
        _id: 0,
        coins: 1,
        username: 1,
        updatedAt: 1,
      })
      .limit(perPage).skip(page * perPage)
      .sort({
        updatedAt: 'desc',
      })
      .exec();

    res.status(200).json(inacUser);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in inactive user API.',
    });
  }
});
/**
 * Get the specific user data
 */
router.get('/:id', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id,'userList');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  if (req.user.role.id == 3 && req.params.id != req.user.id) {
    return res.status(403).json({ messsage: 'Your are not allowed to access this information' });
  }

  // Todo condition for agent role here

  try {
    var user = await User.findById(req.params.id).populate('role');
    if (!user)
      return res.status(404).json({
        message: 'User does not exists in our records.',
      });
    res.json({
      user: user.toJSON(),
    });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: err,
    });
  }
});

/**
 * Get wallet balance
 */
router.get('wallet/:id', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'usercoins');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    var user = await User.findById(req.params.id, 'coins').exec();
    if (!user)
      return res.status(404).json({
        message: 'Isse in checking Wallet balance API.',
      });
    res.json({
      user: user,
    });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: err,
    });
  }
});

/**
 * Create new user.
 */
router.post('/', requireJwtAuth, async (req, res) => {
  let permission = await checkpermission(req.user.role.id, 'addUser');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const user = req.user;


  if (user.role.id == 1 || user.role.id == 2) {
    const { error } = Joi.validate(req.body, addUserSchema);
    if (error) {
      return res.status(422).send({
        message: error.details[0].message,
      });
    }

    try {
      // Default response
      let response = {
        responseStatus: 422,
        status: 0,
        message: 'Issue in user inserting request',
        key: '',
      };

      if (user.role.id == 2 && req.body.commission > user.commission) {
        response.message = 'You can not enter more than your commission ' + user.commission;
        response.key = 'commission.js';
        return res.status(500).json(response);
      }

      /*
      if (user.role.id == 2 && req.body.commission < 4) {
        response.massage = 'You can not Enter Less than 4% commission to Customer.js';
        response.key = 'commission.js';
        return res.status(500).json(response);
      }*/

      if (req.body.role) {
        // Check user is already exists by username
        let checkUserExists = await User.findOne({
          username: req.body.username,
        });

        if (checkUserExists) {
          response.message = 'Please try with different username.js';
          response.key = 'username.js';
          return res.status(response.responseStatus).send({
            response: response,
          });
        }

        let role = await Role.findOne({
          id: req.body.role,
        });

        let parent = req.body.pname;

        if (role && role.id != 1) {
          if (user.role.id == 2) {
            
            if(!parent) {
              parent = user.username
            }

              // Check user is already exists by username
             let parentUserExists = await User.findOne({
              username: parent,
            });

            if (parentUserExists) {
              parent = parentUserExists.id;

              if(parentUserExists.commission < req.body.commission) {
                response.message = 'Please enter commission less than from agent which is. ' + parentUserExists.commission;
            response.key = 'commission.js';
            return res.status(500).send(response);
              }
            }
          
          } else if (parent) {
            // Check user is already exists by username
            let parentUserExists = await User.findOne({
              username: parent,
            });

            if (parentUserExists) {
              parent = parentUserExists.id;

              if(parentUserExists.commission < req.body.commission) {
                response.message = 'Please enter commission less than from agent which is. ' + parentUserExists.commission;
            response.key = 'commission.js';
            return res.status(500).send(response);
              }
            }
          } else if (user.role.id == 1 && role.id == 3 && !parent) {
            response.message = 'Please enter agent name if you want create customer..js';
            response.key = 'parent.js';
            return res.status(500).send(response);
          }

          let displayId = await getDisplayId();

          let newUseInfo = {
            provider: 'username',
            email: req.body.email,
            phone: req.body.phone,
            displayid:displayId,
            username:'P' + displayId,
            name:'P' + displayId,
            password: req.body.password,
            commission: req.body.commission,
            role: role._id,
            coins: req.body.coins,
            image:mansImages[Math.floor(Math.random() * mansImages.length)],
            lockedmoney : req.body.lockedmoney !== undefined ? req.body.lockedmoney : 0,
            status: true,
            games: req.body.games
          };

          if( parent ) {
            newUseInfo.parent =  parent;
          }

          if(!newUseInfo.commission || typeof newUseInfo.commission == undefined ) {
            newUseInfo.commission = 0;
          } 

          // Create user query
          let newUser = await User.create(newUseInfo);

          // Add salting in password
          newUser.registerUser(newUser, (err, user) => {
            if (err) throw err;
            // just redirect to login
            response.message = 'User Created Successfully.js';
            response.status = 1
            return res.status(200).send(response)
          });
        }
      } else {
        response.message = 'Role missed.js';
        response.key = 'role.js';
        return res.status(response.responseStatus).send({
          response: response,
        });
      }
    } catch (err) {
      logger.error(err.message, {metadata: err});
      return res.status(500).json({
        message: err.message || err.toString(),
      });
    }
  } else {
    return res.status(500).json({ status: 0, message: 'Restricted area only for admin/agents' });
  }
});

/**
 * Edit user
 */
//requireJwtAuth
router.put('/:id',requireJwtAuth, async (req, res) => {
  
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'editUser');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  } 

  delete req.body.coins;
  delete req.body.username;
  delete req.body.provider;

  let removePhone = req.body.removephone;
  let removeDevice = req.body.removedevice;


  if(removePhone) {
    req.body.phone = '.js';
    delete req.body.removephone;
  }

  if(removeDevice) {
    req.body.device_id = '.js';
    delete req.body.removedevice;
  }


   if (req.user.role.id == 3 && req.params.id != req.user.id) {
     return res.status(403).json({ messsage: 'Your are not allowed to access this information' });
   }

  // Todo for agent

  let response = {
    status: 0,
    message: 'Issue in update user request',
  };
  try {
  /*  let user = req.user;

    if (user.role.id == 2 && req.body.commission > user.commission) {
      response.message = 'You can not enter more than your commission ' + user.commission;
      response.key = 'commission.js';
      return res.status(500).json(response);
    }

    if (user.role.id == 2 && req.body.commission < 4) {
      response.massage = 'You can not Enter Less than 4% commission to Customer.js';
      response.key = 'commission.js';
      return res.status(500).json(response);
    }

    if (user.role.id == 1) {
      let userUp = await User.findOne(
        { _id: ObjectId(req.params.id), parent: { $type: 'objectId' } },
        '_id commission',
      ).populate('parent').exec();
      if (userUp) {
        if (userUp.parent.commission < req.body.commission) {
          response.message = "You can not enter more than Agent's commission " + userUp.commission;
          response.key = 'commission.js';
          return res.status(500).send({
            response: response,
          });
        }
      }
    } */

    // if(!req.body.commission || typeof req.body.commission == undefined ) {
    //   req.body.commission = 0;
    // } 

    //return res.status(200).json(req.body);  

    let updateUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      {
        new: true,
      },
    );

    if (req.body.password !== undefined && req.body.password) {
      updateUser.registerUser(updateUser, (err, user) => {
        if (err) throw err;

        // res.json({
        //   message: 'User has been updated'
        // }); // just redirect to login
      });
    }
    if (!updateUser)
      return res.status(404).json({
        message: 'Records not found',
      });

    response = {
      status: 1,
      message: 'Updated user',
    };

    res.status(200).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in update user request.',
    });
  }
});

router.post('/change-password', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let response = {
    status: 0,
    message: 'Issue in change password request',
  };

  try {
    let user = req.user;
    let password = req.body.password;
    let newpassword = req.body.newpassword;

    // Check for empty both passwords
    if (!password || !newpassword) {
      response.message = 'Both passwords are required..js';
      return res.status(500).json(response);
    }

    const comparepwd = function (err, isMatch = false) {
      if (isMatch) {
        user.password = newpassword;
        // Add salting in password
        user.registerUser(user, (err, newuser) => {
          if (err) throw err;
        });

        response.status = 1;
        response.message = 'Password updated.js';

      } else {
        response.message = 'Password Incorrect.js';
      }

      res.status(response.status == 1 ? 200 : 500).send(response);
    }
    user.comparePassword(password, comparepwd);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});


router.post('/logout/user', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  try {
    let response = {
      status: 0,
      message: 'Issue in logout request',
    };

    let user = req.user;
    let userId = req.body.userId;
    if (user.role.id == 1 || user.role.id == 2) {
      let loggUser = await User.updateOne({ _id: ObjectId(userId) }, { token: '' }).exec();

      response.status = 1;
      response.message = 'logout successfully.js';

    }
    //res.send(loggUser);
    res.status(response.status == 1 ? 200 : 500).send(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});


router.post('/register', async (req, res) => {
  const { error } = Joi.validate(req.body, addUsersSchema);
  if (error) {
    return res.status(422).send({
      message: error.details[0].message,
    });
  }

  let response = {
    status: 0,
    message: 'Issue in user register request',
  };

  try {
    let mobile = req.body.phone;
    let otp = Math.floor(100000 + Math.random() * 900000);
    let userF = await User.findOne({
      $or: [
        { 'phone': req.body.phone },
        { 'username': req.body.username },
        { 'email': req.body.email }
      ]
    });
    if (userF) {
      response.message = 'This User already Exists.js';
      response.status = 0;
      return res.status(500).json(response);
    } else {
    var url = `http://sms.havfly.com/api/smsapi?key=d44b1d7c8409ed643ae8eee60508939b&route=4&sender=FTYCRD&number=${mobile}&sms=FTYCRD%20login%20OTP%20is%20${otp}&templateid=1207166745236054944`;

    fileGetContents(url).then(json => {
      JSON.parse(json);
    }).catch(err => {
      logger.error(err.message, {metadata: err});
      return res.send({ err: err.message });
    });

    let agent = await User.findOne({
      username: 'masteragent',
    });

    let newUser = await User.create({
      provider: 'user',
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: mobile,
      username: req.body.username,
      role: ObjectId('6114d5c422b7c53a358bba0b'),
      parent: agent.id,
      otp_state: 0,
      otp: otp,
      status: true
    });

    newUser.registerUser(newUser, (err, user) => {
      if (err) throw err;
      // just redirect to login
      response.message = "OTP is Send to your Mobile Number. Please Verify";
      response.status = 1;
      response.user = newUser;
      return res.status(200).send(response)
    });
  }
  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
    });
  }
});

// Play as gust request
router.post('/registerplayasgust', async (req, res) => {
  
  // Default response 
  let response = {
    status: 0,
    message: 'Issue in user register request',
  };
  
  
  
  try {

    // Device id
    let device_id = req.body.device_id;

    if(!device_id) {
      response.message = 'Please provide device id..js';
      return res.status(500).json(response);
    }

    
   let checkIfLockedDevice = await LockedDevices.findOne({deviceid:device_id});

   if(checkIfLockedDevice) {
    response.message = 'Please login with mobile and otp..js';
    return res.status(500).json(response);
   }

   
    // App version
    let app_version = req.body.appversion;

    if(!app_version) {
      response.message = 'Please provide app version..js';
      return res.status(500).json(response);
    }

    // Checking user exists with device id
    let user = await User.findOne({ device_id : device_id }).exec();

    let signupAmount = await settingsData('teempatti_signupamount');

    // Return if exists else create user.
    if ( user ) {

      if(!user.status) {
        response.message = 'Something went wrong..js';
        return res.status(500).json(response);
      }

      response.user = user;
      response.message = 'This User already Exists.js';
      response.status = 1;

    } else {

      let displayId = await getDisplayId();

      response.user = await User.create({
        provider: 'username',
        device_id: req.body.device_id,
        commission: 0,
        role: ObjectId( env.DEFAULT_ROLE_APP_SIGNUP ),
        parent: ObjectId( env.DEFAULT_AGENT_APP_SIGNUP ),
        coins: parseFloat(signupAmount),
        lockedmoney : parseFloat(signupAmount),
        displayid:displayId,
        username:'P' + displayId,
        name:'P' + displayId,
        status: true,
        token:'',
        image:mansImages[Math.floor(Math.random() * mansImages.length)],
        refer_code: await generateReferCode(),
        games: await getAllGames(),
        //games: []
      });

      
      if( response.user ) {

        //response.user.username = response.user.id;
        //response.user.name = 'Player_'+ response.user.id,
        response.message = 'New user has been created..js';
        response.status = 1;

      }

      let transactions = [];

      let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

      transactions.push({
      type: "ADD",
      toUser: response.user.id,
      fromUser: ObjectId(fromUser.id),
      trans_coins: parseFloat(signupAmount),
      comment: 'signup',
      remaining_coins: response.user.coins
  });

  if(transactions.length) {
    await Transaction.insertMany(transactions);
  }
    }

    if( response.user ) {
      
      response.user.token = await response.user.generateJWT((req.body.appversion ? req.body.appversion : '' ));
    
      response.user.deviceName = req.body.deviceName == undefined ? '' : req.body.deviceName;
      response.user.os = req.body.os == undefined ? '' : req.body.os;  
      response.user.requestIp = requestIp.getClientIp(req);
      
      await response.user.save();
    }  

    return res.json(response);
   
  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
    });
  }
});

// Play as gust request
router.post('/otpsend', async (req, res) => {
  
  // Default response 
  let response = {
    status: 0,
    message: 'Issue in send otp.',
  };

  try {

    // Device id
    let mobile = req.body.phone;

    mobile = mobile.toString();

    if(!mobile) {
      response.message = 'Please provide mobile number to send otp..js';
      return res.status(500).json(response);
    }



      // Check mobile otp
      let checkMobileNumberOtp = await Otp.findOne({'mobile':mobile}).exec();

      let checkUserExists = await User.findOne({phone:mobile});

      if( checkUserExists && !checkUserExists.status ) {
        response.status = 0;
        response.message = 'Something went wrong..js';
        return res.status(500).json(response);
      }
      
      let otp = Math.floor(1000 + Math.random() * 9000);

      let url = `http://sms.havfly.com/api/smsapi?key=d44b1d7c8409ed643ae8eee60508939b&route=4&sender=FTYCRD&number=${mobile}&sms=FTYCRD%20login%20OTP%20is%20${otp}&templateid=1207166745236054944`;
      let referenceno = await fileGetContents(url);

      if( checkMobileNumberOtp ) {
        checkMobileNumberOtp.otp = otp;
        checkMobileNumberOtp.status = false;
        await checkMobileNumberOtp.save();
      } else {
        await Otp.create({
          mobile:mobile,
          otp:otp,
          status:false
        });
      }

      response.status = 1;
      response.message = 'Otp has been sent.js';
      response.reference = referenceno;

      return res.json(response);
   
  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
    });
  }
});

router.post('/bindnumber', requireJwtAuth, async (req, res) => {
  
  // Default response 
  let response = {
    status: 0,
    message: 'Issue in send otp.',
  };

  try {

    // Device id
    let mobile = req.body.phone;

    if(!mobile) {
      response.message = 'Please provide mobile number to send otp..js';
      return res.status(500).json(response);
    }

    
    let checkUserExists = await User.findOne({'phone': mobile}).exec();

    if( checkUserExists ) {
      
      response.status = 0;
      response.message = 'This mobile number is already exists..js';
    
    } else {

        // Check mobile otp
      let checkMobileNumberOtp = await Otp.findOne({'mobile':mobile}).exec();
      
      let otp = Math.floor(1000 + Math.random() * 9000);

      let url = `http://sms.havfly.com/api/smsapi?key=d44b1d7c8409ed643ae8eee60508939b&route=4&sender=FTYCRD&number=${mobile}&sms=FTYCRD%20login%20OTP%20is%20${otp}&templateid=1207166745236054944`;
      let referenceno = await fileGetContents(url);

      if( checkMobileNumberOtp ) {
        checkMobileNumberOtp.otp = otp;
        checkMobileNumberOtp.status = false;
        await checkMobileNumberOtp.save();
      } else {
        await Otp.create({
          mobile:mobile,
          otp:otp,
          status:false
        });
      }

      response.status = 1;
      response.message = 'Otp has been sent.js';
      response.reference = referenceno;
    }

      return res.status(response.status == 1 ? 200 : 500).json(response);
   
  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  
  // Default response
  let response = {
    status: 0,
    message: 'Issue in otp verify request.',
  };

  try {
    

    let signupAmount = await settingsData('teempatti_signupamount');

    // Device id
    let mobile = req.body.phone;

    if(!mobile) {
      response.message = 'Please provide mobile..js';
      return res.status(500).json(response);
    }

    if(!req.body.device_id) {
      response.message = 'Please provide device id..js';
      return res.status(500).json(response);
    }

    let checkIfLockedDevice = await LockedDevices.findOne({deviceid:req.body.device_id});

        if(checkIfLockedDevice) {
          response.message = 'Issue with devices id..js';
          return res.status(500).json(response);
        }

    // OTP
    let otp = req.body.otp;

    if(!otp) {
      response.message = 'Please provide otp..js';
      return res.status(500).json(response);
    }
    
    // Status
    let status = false;

  let verifyotp = await Otp.findOne({ 'mobile':mobile , 'otp':otp, 'status': false }).exec();
    
   if ( verifyotp ) {

      verifyotp.status = true;
      await verifyotp.save();
      response.status = 1;
      response.message = 'Otp verified.js';

      // User id
      let userid = req.body.userid;

      if( userid ) {
        let user = await User.findOne({'_id': ObjectId(userid)}).exec();

        if(!user) {
  
          response.status = 0;
          response.message = 'Can not find user with user id..js';
        
        } else {

          if(user.phone) {
            // Remove user from teenPatti socket
            user.loginAgain = 1;
          }

          user.phone = mobile;
          await user.save();

          response.status = 1;
          response.message = 'Updated user mobile with user id..js';  
  
        }
        return res.status(response.status == 1 ? 200 : 500).json(response);
      }
      
      
      let checkUserExists = await User.findOne({'phone': mobile}).exec();
      
      if(checkUserExists) {
        
        if( !checkUserExists.status ) {
          response.status = 0;
          response.message = 'Something went wrong..js';
          return res.status(500).json(response);
        }

        // Update new device id
        if(checkUserExists.device_id != req.body.device_id) {
          let oldDevice = checkUserExists.device_id;

          await LockedDevices.updateOne(
            {
              deviceid : oldDevice
            }, 
             {
              $setOnInsert: {deviceid : oldDevice}
             },
             {upsert: true}
          );

          checkUserExists.device_id = req.body.device_id;

        }

        response.user = checkUserExists;
        response.user.token = checkUserExists.generateJWT( (req.body.appversion ? req.body.appversion : '' ));
        checkUserExists.deviceName = req.body.deviceName == undefined ? '' : req.body.deviceName;
        checkUserExists.os = req.body.os == undefined ? '' : req.body.os;  
        checkUserExists.customerIp = requestIp.getClientIp(req);
        checkUserExists.token = response.user.token;
        await checkUserExists.save();

      } else {

        let checkUserExists = await User.findOne({'device_id': req.body.device_id}).exec();

        if(checkUserExists) {
          response.user = checkUserExists
          
          if( response.user.phone ) {
          let ph = checkUserExists.phone;
            
          response.message = 'This device is already connected with xxxxx' + ph.substr(-5);
          return res.status(500).json(response);
          
        } else {
          response.user.phone = mobile;
        }

        checkUserExists.deviceName = req.body.deviceName == undefined ? '' : req.body.deviceName;
        checkUserExists.os = req.body.os == undefined ? '' : req.body.os;  
        checkUserExists.customerIp = requestIp.getClientIp(req);
        

      } else {
        let displayId = await getDisplayId();
        response.user = await User.create({
          provider: 'username',
          commission: 0,
          role: ObjectId( env.DEFAULT_ROLE_APP_SIGNUP ),
          parent: ObjectId( env.DEFAULT_AGENT_APP_SIGNUP ),
          coins: parseFloat(signupAmount),
          lockedmoney : parseFloat(signupAmount),
          displayid:displayId,
          username:'P' + displayId,
          name:'P' + displayId,
          status: true,
          token:'',
          phone:mobile,
          refer_code: await generateReferCode(),
          games: await getAllGames(),
          device_id:req.body.device_id,
          deviceName: req.body.deviceName == undefined ? '' : req.body.deviceName,
          os:req.body.os == undefined ? '' : req.body.os,
          customerIp : requestIp.getClientIp(req)
          //games: []
        });
      }


      if(checkUserExists) {
        checkUserExists.token = response.user.token;
        await checkUserExists.save();
      }
      

        if( response.user ) {

          // response.user.username = response.user.id;
          // response.user.name = 'Player_'+ response.user.id,
          //await response.user.save();
  
          response.user.token = await response.user.generateJWT( (req.body.appversion ? req.body.appversion : '' ) );
          await response.user.save();

          response.message = 'New user has been created..js';
          response.status = 1;

          // Todo transaction
          let transactions = [];

          let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

          if(signupAmount) {
            transactions.push({
            type: "ADD",
            toUser: response.user.id,
            fromUser: ObjectId(fromUser.id),
            trans_coins: parseFloat(signupAmount),
            comment: 'signup',
            remaining_coins: response.user.coins
        });
          }
          

      if(transactions.length) {

        fromUser.coins = fromUser.coins - signupAmount;
        await fromUser.save();
        await Transaction.insertMany(transactions);
      }
      
        }
      }
    } else {

      response.message = 'Wrong otp provided..js';
    }

    res.status(response.status == 1 ?  200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  };
});

//
router.post('/referral_user_info' , requireJwtAuth, async (req, res) => {
  

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // Default response
  let response = {
    status: 0,
    message: 'Issue referral user info request.',
  };

  try {
    
    // Device id
    let code = req.body.code;
    let name = req.body.name;
    let email = req.body.email;

    if(!name) {
      response.message = 'Please provide name..js';
      return res.status(500).json(response);
    }

    // If code entered
    if(code) {
      
      // Get user by code
      let user = await User.findOne({refer_code:code}).exec();

      if(!user) {
        response.message = 'Referral code user not found in records..js';
        return res.status(500).json(response);
      }

      // Get all settings
      let settings = await settingsData();

      // Get refferal code rewards amount
      let referralRewards = parseFloat(settings['referral_rewards']);
      
      // Use rewards amount
      let referralRewardsUse = parseFloat(settings['referral_rewards_use']);

      // Get coins
      req.user.coins = req.user.coins + referralRewardsUse;
      user.coins = user.coins + referralRewards;
      await user.save();

      // Get admin details
      let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

      // From user coins
      fromUser.coins = fromUser.coins - ( referralRewardsUse + referralRewards );  
      await fromUser.save();

      let trans_coins = referralRewardsUse; 
      let toUser = req.user.id;

      // Make the transactions init
      let transactions = [];

      transactions.push({
        type: "SUBTRACT",
        toUser: ObjectId(fromUser.id),
        fromUser: ObjectId(toUser),
        trans_coins: trans_coins ,
        comment: 'Refferral Cashback',
        remaining_coins: fromUser.coins
    },{
      type: "ADD",
      toUser: toUser,
      fromUser: ObjectId(fromUser.id),
      trans_coins: trans_coins,
      comment: 'Refferral Cashback Use',
      remaining_coins: req.user.coins
  });

      trans_coins = referralRewards; 
      toUser = user.id;

      transactions.push({
        type: "SUBTRACT",
        toUser: ObjectId(fromUser.id),
        fromUser: ObjectId(toUser),
        trans_coins: trans_coins ,
        comment: 'Refferral Cashback',
        remaining_coins: fromUser.coins
      },{
        type: "ADD",
        toUser: toUser,
        fromUser: ObjectId(fromUser.id),
        trans_coins: trans_coins,
        comment: 'Refferral Cashback Code',
        remaining_coins: user.coins
      });

      // Entered all transactions
      await Transaction.insertMany(transactions);
    }

    // Update name if provided
    if(name) {
      req.user.name = name.trim();
    }

    // Update email if provided
    if(email) {
      req.user.email = email.trim();
    }
   
  await req.user.save();

  response.status = 1;
  response.message = 'Updated referral and other things coins.js';
  response.coins = req.user.coins;
  response.name = req.user.name;
  response.email = req.user.email;
  return res.status(response.status == 1 ?  200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    return res.status(500).json(response);
  };
});



export default router;
