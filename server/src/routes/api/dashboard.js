import GameHistory from "../../models/GameHistory";
import {
  Router
} from 'express';
import { verifyToken, checkpermission  } from '../../helper/common.js';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import User from "../../models/User";
import Betting from "../../models/Betting";
import Payment from "../../models/Payment";
import 'dotenv';
let logger = require('../../services/logger');

const env = process.env;
const router = Router();
const ObjectId = require('mongoose').Types.ObjectId;

var start = new Date();
start.setHours(0, 0, 0, 0);

var end = new Date();
end.setHours(23, 59, 59, 999);

var promise = require('promise')

router.get('/', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'dashboard');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  // Default Response
  let response = {
    status: 0,
    message: 'Issue in Todays Total Transactions Dashboard API',
  };

  try {

//     "Show in header = total customer, total online deposit amount, 
// pending no of withdrawal, online users"


    const betAmount = GameHistory.aggregate([{
      $group: {
        _id: null,
        total_betting: {
          $sum: '$total_betting',
        },
        total_winning: {
          $sum: '$total_winning',
        }
      },
    }, ]).exec();


    const agentsTotal = User.aggregate([{
        $match: {
          'role': ObjectId("6114d59922b7c53a358bba09"),
        }
      },
      {
        $group: {
          _id: null,
          "agents": {
            $sum: 1
          }
        }
      },
    ]).exec();

    const custTotal = User.aggregate([{
        $match: {
          'role': ObjectId("6114d5c422b7c53a358bba0b"),
        }
      },
      {
        $group: {
          _id: null,
          "customers": {
            $sum: 1
          }
        }
      },
    ]).exec();

    const blockUsers = User.aggregate([{
        $match: {
          "status": false,
        }
      },
      {
        $group: {
          _id: null,
          "Blocked": {
            $sum: 1
          }
        }
      },
    ]).exec();

    const adminCoins = User.aggregate([{
        $match: {
          'role': ObjectId("6114d54122b7c53a358bba04")
        }
      },
      {
        $project: {
          _id: 0,
          "coins": 1
        }
      },
    ]).exec();

    const dashboard = await promise.all([betAmount, agentsTotal, custTotal, blockUsers, adminCoins])
    const data = {};
    for (let i = 0; i < dashboard.length; i++) {
      let key = (i + 1).toString();
      data[key] = dashboard[i];
    }

    response.status = 1;
    response.data = data;
    response.logo = env.GAME_LOGO;
    response.message = "Data";

    res.status(response.status == 1 ? 200 : 500).json(response);


  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }

})

//
router.post('/graphfilter', requireJwtAuth , async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'graphfilter');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }
  

  let response = {
    status : 1,
    message : 'Issue in user listing'
   };

  try {

    
    let filters = {};

    let cuDate = new Date();
    cuDate.setHours(0, 0, 0, 0);

    let start = req.body.start ? new Date(req.body.start) : cuDate;
    let end = req.body.end ? new Date(req.body.end) : new Date();
    
     filters.createdAt = {
       $gte: start.toISOString(),
       $lte: end.toISOString()
    }
    
    if( req.body.currentPage ) {
      page = parseInt(req.body.currentPage)
    }

   filters.type = {$eq: 'WITHDRAW'};

   let withdraw = Payment.find(filters,'_id createdAt').sort({
      _id: 'desc'
    });

    filters.type = {$eq: 'ADD'};

    let payments = Payment.find(filters,'_id createdAt').sort({
      _id: 'desc'
    });

    delete filters.type;
    let users =  User.find(filters, '_id createdAt').sort({
      _id: 'desc'
    });


    let rsForAllQuery = await Promise.all([withdraw,payments,users]);

    
    response.withdraw = rsForAllQuery[0];
    response.payments = rsForAllQuery[1];
    response.users = rsForAllQuery[2];
    response.status = 1;
    response.message = 'Get data.js';
    return res.status(response.status == 1 ? 200 : 500 ).json(response);

  } catch (err) {
    response.status = 0;
    response.message = err.message || err.toString(); 
    res.status(500).json(response);
  }
});

router.get('/winners', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'getWinners');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  // Default Response
  let response = {
    status: 0,
    message: 'Issue in Todays Winners Dashboard API',
  };
  try {
    const winners = await Betting.aggregate([{
        $match: {
          'createdAt': {
            $gte: start,
            $lte: end
          },
          win_status: true
        }
      },
      {
        $project: {
          'numbers': 0,
          'tokens': 0
        }
      }
    ]).exec();

    response.status = 1;
    response.data = winners;
    response.message = "Todays Winners List";

    res.status(response.status == 1 ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
})

router.get('/demo', async (req, res) => {
    res.send('');
});

router.post('/demo', async (req, res) => {
  res.send('');
});
export default router;