import {
  response,
  Router
} from 'express';
import {
  updateWallet
} from '../../helper/wallet.js';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
import { checkpermission, verifyToken, treeUnderUser  } from '../../helper/common.js';
import GameHistory from '../../models/GameHistory.js';
import Game from '../../models/Game.js';
let logger = require('../../services/logger');
const ObjectId = require('mongoose').Types.ObjectId;
const router = Router();

/**
 * Get the listing of Transactions.
 */
router.get('/', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'listUserTrans');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {
    
    const transactions = await Transaction.find().sort({
        createdAt: 'desc'
      })
      .populate('user');

    res.json({
      transactions: transactions.map((m) => {
        return m.toJSON();
      }),
    });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in wallet trascation listing API.'
    });
  }
});

//
// Get last ten transactions
router.get('/owntransaction', requireJwtAuth, async (req, res) => {
  
  // Verify token
   let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }
  
  let permission = await checkpermission(req.user.role.id,'listUserTrans');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  } 

  try {

    let userId = req.user.id;

    let filters = {};


    filters.$or = [{
      toUser: ObjectId(userId),
      type: "ADD"
    },
    {
      fromUser: ObjectId(userId),
      type: "WITHDRAW"
    },
    {
      fromUser: ObjectId(userId),
      type: "SUBTRACT",
     // toUser: {$ne : ObjectId('61160d8e90f4c31eb5433773')}
    },
  ];
    
  const transactions = await Transaction.find(filters,{game_history_id : 0,fromUser:0,toUser:0}).limit(10).sort({
        createdAt: -1
      }).populate('game_id',{_id:0,name:1});

    res.json(transactions);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Get the listing of Transactions  by user wise.
 */
router.post('/', requireJwtAuth, async (req, res) => {
  
  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }
  
  let permission = await checkpermission(req.user.role.id,'listUserTrans');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {

    const user = await req.user.getUserWithRole(req.user);

    let currentUserId = user._id;
    const currentUserRole = user.role.id;
    let filters = {};
    const ObjectId = require('mongoose').Types.ObjectId;

    let type = req.body.type;
    let allTransaction = req.body.alltransaction;
    let userId = req.body.userid;
    let perPage = 20, page = parseInt(req.body.currentPage);

    filters.$or = [{
          toUser: ObjectId(currentUserId)
        },
        {
          fromUser: ObjectId(currentUserId),
          toUser: {
            "$exists": false
          }
        },
        {
          fromUser: ObjectId(currentUserId),
          type: "WITHDRAW"
        }
      ];

    if (currentUserRole == 1) {
      if (allTransaction == 1) {
        filters = {};
      } else if (userId) {
        // filters.$or = [{
        //       toUser: ObjectId(userId),
        //       type: "ADD"
        //     },
        //     {
        //       fromUser: ObjectId(userId)
        //     }
        //   ];

        filters.$or = [{
          toUser: ObjectId(userId),
          type: "ADD"
        },
        {
          fromUser: ObjectId(userId),
          type: "WITHDRAW"
        },
        {
          fromUser: ObjectId(userId),
          type: "SUBTRACT",
          //toUser: {$ne : ObjectId('61160d8e90f4c31eb5433773')}
        },
      ];


      }
    }

    if (type) {
      filters.type = type;
    }

    const transactions = await Transaction.find(filters).limit(perPage).skip(page * perPage).sort({
        _id: -1
      })
      .populate('toUser').populate('fromUser').populate('game_history_id').exec();

    res.json(transactions);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Get the listing of Transactions  by user wise.
 */
 router.post('/filter', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'listTrans');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {
    const user = req.user;

    let allChild = [];
    

    let reslt = 0;
    
    let currentUserId = user._id;
    

    let filters = {};
    const ObjectId = require('mongoose').Types.ObjectId;

    let cuDate = new Date();
    
    
    let start = req.body.start ? req.body.start : cuDate.setHours(0,0,0,0);
    let end = req.body.end ? req.body.end : new Date();
    let unsername = req.body.username;
    let type = req.body.type;
    let gameHisId = req.body._id;
    let gameId = req.body.gamename;

    let currentWeekDay;
    let currentMonthDay;
    let daySelect = req.body.day;

     //current week
     if( daySelect == "today1") {
      end = new Date();
      start =  new Date();
      reslt = 1;
      start.setHours(0,0,0,0);
  
  } else if( daySelect == "thisWeek1") {
     end = new Date();
     start =  new Date();
     reslt = 1;

    
     currentWeekDay = end.getDay();
    
    if(currentWeekDay > 1 ) {
        currentWeekDay = currentWeekDay -1;
    }
    
    start.setDate(start.getDate() - currentWeekDay);
    start.setHours(0,0,0,0);

    filters.updatedAt = {
      $gte: start.toString(),
      $lte: end.toString()        
    }
}   
    
    // Last Week
    if( daySelect == "lastWeek1") {
     end = new Date();
     start =  new Date();
    
     currentWeekDay = end.getDay();
    end.setDate(end.getDate() - currentWeekDay);
    end.setHours(23,59,59,999);
    
    start.setDate(end.getDate() - 6 );
    start.setHours(0,0,0,0);

    reslt = 1;
    filters.updatedAt = {
      $gte: start.toISOString(),
      $lte: end.toISOString()        
    }
}
  // this month
  if( daySelect == "thisMonth1") {
    end = new Date();
    start =  new Date();
    reslt =1;
    currentMonthDay = end.getDate();
    
    if(currentMonthDay > 1 ) {
        currentMonthDay = currentMonthDay -1;
    }
    
    start.setDate(start.getDate() - currentMonthDay);
    
    start.setHours(0,0,0,0);

   filters.updatedAt = {
     $gte: start.toISOString(),
     $lte: end.toISOString()        
   }
}     

  //previous Month
  if( daySelect == "thisLastMonth1") {
      end = new Date();
      start =  new Date();
      reslt = 1;
      currentMonthDay = end.getDate();
      end.setDate(end.getDate() - currentMonthDay);
      end.setHours(23,59,59,999);

      start.setDate(start.getDate() - currentMonthDay);
      start.setDate(start.getDate() + 1 - end.getDate()) ;
      start.setHours(0,0,0,0);

      filters.updatedAt = {
        $gte: start.toISOString(),
        $lte: end.toISOString()        
   }
}  





   if( unsername && user.role.id != 3 ) {
     
      let selectUser = await User.findOne({'username':unsername },'_id').exec();
      
      allChild = await treeUnderUser(user.id);

      if( selectUser ) {

        if( user.role.id == 2 ) {

          if(!allChild.includes(selectUser.id)) {

            response.message = 'user does not exist under this agent.js';
            return res.status(500).json({'message' : 'user not found'});
          } 
        }
        reslt = 1;
        filters.$or = [{
              toUser: ObjectId(selectUser._id),
              type: "ADD"
            },
            {
              fromUser: ObjectId(selectUser._id)
            }
          ];
      } 
    }

    if(gameHisId) {
      let selectGame = await GameHistory.findById({'_id': gameHisId }, '_id').exec();

      if(selectGame) {
        reslt = 1;
        filters = {
          game_history_id: ObjectId(selectGame._id)
        }
      }
    }


    if( gameId ) {
      let selGame = await Game.findById({'_id': gameId }, '_id').exec();

      if(selGame) {
        reslt = 1;
        filters = {
          game_id: ObjectId(selGame._id)
        }
      }
    }

    if( user.role.id == 3 ) {
      //filters.user = user.id;
    
    
      filters.$or = [{
            toUser: ObjectId(user.id),
            type: "ADD"
          },
          {
            fromUser: ObjectId(user.id)
          }
        ];
    }

    let perPage = 20, page = parseInt(req.body.currentPage);

    if(user.role.id == 2 && !unsername) {
   
     allChild = await treeUnderUser(user.id);
     filters.$or = [{
           toUser: {$in: allChild},
         },
         {
           fromUser: {$in: allChild},
           toUser: {
             "$exists": false
           }
         },
         {
           fromUser: {$in: allChild},
           type: "WITHDRAW"
         }
       ]
     }  
   
    
    if(start && end) {

      reslt = 1;

      start = new Date(start);
      end = new Date(end);

      filters.updatedAt = {
        $gte: start.toISOString(),
        $lte: end.toISOString()        
      }

    }
    if (type) {
      reslt = 1;
      filters.type = type;
    } else {
      filters.type = { $ne : 'REVERSE'}
    }

    let transactions = {};


 if( user.role.id == 3 ) {
  //filters.user = user.id;


  filters.$or = [{
        toUser: ObjectId(user.id),
        type: "ADD"
      },
      {
        fromUser: ObjectId(user.id)
      }
    ];
}


    if(reslt) {
      
      filters.game_history_id = {$not: {$type : "objectId" }};
      
      transactions = await Transaction.find(filters).limit(perPage).skip(page*perPage).sort({
        updatedAt: 'desc'
      })
      .populate('toUser').populate('fromUser').exec();
    }
    
    res.json(transactions);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Get specific wallet transactions
 */
router.get('/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'listTrans');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({
      message: 'Not transactions found.'
    });
    res.json({
      transaction: transaction.toJSON()
    });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue single transaction wallet API.'
    });
  }
});

/**
 * Create new transaction in Wallet.
 */
router.post('/wallet', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'wallet');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }


  let type;
  let fromUser;
  let toUser;
  let comment;
  let trans_coins = req.body.trans_coins;


  let response = {
    'status': 0,
    'message': "Issue in wallet api request"
  }

  try {

    if (!trans_coins) {

      response.message = "Provide tranactions coins";
      return res.json(response);

    } else if (trans_coins < 0) {

      trans_coins = trans_coins * -1;
      type = 'WITHDRAW.js';
      fromUser = req.body.user_id;
      toUser = req.user.id;
      comment = 'Withdraw request proccessed..js';

      let toUserForLocked = await User.findById(fromUser,'coins lockedmoney');
      let maximumWithDrawal =  toUserForLocked.coins -  toUserForLocked.lockedmoney;
      
      if( trans_coins > maximumWithDrawal ) {

        response.message = "Your maximum withdrawal amount is " + maximumWithDrawal ;
        return res.json(response);

      }

    } else if (trans_coins > 0) {

      type = 'ADD.js';
      fromUser = req.user.id;
      toUser = req.body.user_id;
      comment = 'Coins added by admin/agent.'

      let toUserForLocked = await User.findById(toUser);

      if(req.body.lockedmoney !== undefined) {
       
        let lockedmoney = req.body.lockedmoney;
        toUserForLocked.lockedmoney =  toUserForLocked.lockedmoney + lockedmoney;
        toUserForLocked.cashflow.bonus_coins += lockedmoney;
      }

      toUserForLocked.cashflow.offline_add_coins += trans_coins;
      await toUserForLocked.save();

    }

    let fUser = await User.findById(fromUser).exec();

    if (fUser.coins >= trans_coins) {
     await updateWallet(type, 0, toUser, fromUser, trans_coins, 0, 0, comment, function (resp) {
      });

      response.message = "Transaction Done";
      response.status = 1;

    } else {

      response.message = "You can not add/withdraw from more than wallet amount";


    }
   return res.json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

export default router;