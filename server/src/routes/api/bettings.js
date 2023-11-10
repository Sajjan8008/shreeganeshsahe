import {
  json,
  response,
  Router
} from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Betting from '../../models/Betting.js';
import Joi from 'joi';
import {
  insertRouletteBetting, insertLuckyCardTicketBetting
} from '../../services/validators.js';
import BettingType from '../../models/BettingType.js';
import 'dotenv';

import {
  settingsData,
  bettingAlowedGame,
  verifyToken,
  treeUnderUser,
  checkpermission,
  crGame
} from '../../helper/common.js';
import User from '../../models/User.js';
import Game from '../../models/Game.js';
import Transaction from '../../models/Transaction.js';
import GameHistory from '../../models/GameHistory.js';
let logger = require('../../services/logger');


var promise = require('promise')

const router = Router();

const ObjectId = require('mongoose').Types.ObjectId;

/**
 * Get bettings of current user in unity.
 */
router.get('/unityfilter', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  try {
    const user = req.user;

    let permission = await checkpermission(req.user.role.id, 'betList');
    if (permission.status == 0) {
      return res.status(403).json(permission);
    }

    let currentUserId = user.id;
    let filters = {};

    filters.status = "completed";

    const ObjectId = require('mongoose').Types.ObjectId;

    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);


    filters.user = ObjectId(currentUserId);
    filters.game = ObjectId(user.current_game);

    filters.createdAt = {
      $gte: start.toISOString(),
      $lte: end.toISOString()
    }

    let userBettings = {}

    let bettings = await Betting.find(filters).sort({
      updatedAt: 'desc',
    }).populate('user').populate('game_history').exec();

    for (let singleBet of bettings) {

      if (singleBet.user !== null && singleBet.game_history !== null) {
        if (userBettings[singleBet.game_history.id] === undefined) {

          userBettings[singleBet.game_history.id] = {};
          userBettings[singleBet.game_history.id]['betamount'] = 0;
          userBettings[singleBet.game_history.id]['winamount'] = 0;

        }

        userBettings[singleBet.game_history.id]['start'] = singleBet.game_history.start;
        userBettings[singleBet.game_history.id]['end'] = singleBet.game_history.end;
        userBettings[singleBet.game_history.id]['username'] = singleBet.user.username;
        userBettings[singleBet.game_history.id]['winnumber'] = singleBet.game_history.number;
        userBettings[singleBet.game_history.id]['jackpot'] = singleBet.game_history.jackpot;
        userBettings[singleBet.game_history.id]['betamount'] += singleBet.amount;
        if (singleBet.win_status) {
          userBettings[singleBet.game_history.id]['winamount'] += singleBet.winning;
        }
      }
    }


    let resBettings = [];

    for (let singleGameBet in userBettings) {
      resBettings.push(userBettings[singleGameBet]);

    }

    res.json(resBettings);

  } catch (err) {
    
    logger.error(err.message, {metadata: err});

    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});


router.post('/filter', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'betList');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {

    let settings = await settingsData();
    let rouleteGame = settings['ROLLETE_GAME_ID']
    let currGame = await crGame(rouleteGame);



    let lcGame = settings['Lucky_Card_GAME_ID']
    let currGameLc = await crGame(lcGame);


    const user = req.user;
    let reslt = 0;

    let filters = {};

    const ObjectId = require('mongoose').Types.ObjectId;

    let cuDate = new Date();
    cuDate.setHours(0, 0, 0, 0);

    let start = req.body.start ? new Date(req.body.start) : cuDate;
    let end = req.body.end ? new Date(req.body.end) : new Date();

    let unsername = req.body.username;
    let gameId = req.body.gamename;

    let currentWeekDay;
    let currentMonthDay;
    let daySelect = req.body.day;

    //current week
    if (daySelect == "today1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      start.setHours(0, 0, 0, 0);

    } else if (daySelect == "thisWeek1") {
      end = new Date();
      start = new Date();
      reslt = 1;


      currentWeekDay = end.getDay();

      if (currentWeekDay > 1) {
        currentWeekDay = currentWeekDay - 1;
      }

      start.setDate(start.getDate() - currentWeekDay);
      start.setHours(0, 0, 0, 0);

    } else if (daySelect == "lastWeek1") {
      end = new Date();
      start = new Date();

      currentWeekDay = end.getDay();
      end.setDate(end.getDate() - currentWeekDay);
      end.setHours(23, 59, 59, 999);

      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      reslt = 1;

    } else if (daySelect == "thisMonth1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      currentMonthDay = end.getDate();

      if (currentMonthDay > 1) {
        currentMonthDay = currentMonthDay - 1;
      }

      start.setDate(start.getDate() - currentMonthDay);

      start.setHours(0, 0, 0, 0);


    } else if (daySelect == "thisLastMonth1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      currentMonthDay = end.getDate();
      end.setDate(end.getDate() - currentMonthDay);
      end.setHours(23, 59, 59, 999);

      start.setDate(start.getDate() - currentMonthDay);
      start.setDate(start.getDate() + 1 - end.getDate());
      start.setHours(0, 0, 0, 0);


    }



    if (unsername && user.role.id != 3) {

      let selectUser = await User.findOne({
        'username': unsername
      }, '_id').exec();

      if (selectUser) {

        if (user.role.id == 2) {

          let allChildCheck = await treeUnderUser(user.id);

          if (!allChildCheck.includes(selectUser.id)) {

            response.message = 'user does not exist under this agent.js';
            return res.status(500).json({
              'message': 'user not found'
            });
          }
        }


        reslt = 1;
        filters.$or = [{
          toUser: ObjectId(selectUser.id),
          type: "ADD"
        },
        {
          fromUser: ObjectId(selectUser.id),
          type: "SUBTRACT"
        }
        ];

      }
    }



    reslt = 1;
    filters.createdAt = {
      $gte: start.toString(),
      $lte: end.toString()
    }



    if (gameId) {
      let selGame = await Game.findById({
        '_id': gameId
      }, '_id').exec();

      if (selGame) {
        reslt = 1;
        filters.game_id = selGame._id;
      }
    }



    if (user.role.id == 3) {
      filters.$or = [{
        toUser: ObjectId(user.id),
        type: "ADD"
      },
      {
        fromUser: ObjectId(user.id),
        type: "SUBTRACT"
      }
      ];
    }


    let allChild;
    if (user.role.id == 2 && !unsername) {
      allChild = await treeUnderUser(user.id);

      filters.$or = [{
        toUser: {
          $in: allChild
        },
        type: "ADD"
      },
      {
        fromUser: {
          $in: allChild
        },
        type: "SUBTRACT"
      }
      ];

    }


    let bettings = {};
    let userBettings = {};
    let transactions;
    let perPage = 100, page = parseInt(req.body.currentPage);
    if (reslt) {

      // 1. group by game history and user betamount total
      // 1. group by game history and user agr winstatus true to wiing ++ betamount total
      filters.game_history_id = {
        $type: "objectId",
       // $nin: [currGameLc.id, currGame.id]
      };

      //filters.game_history_id = { $nin: [currGameLc.id, currGame.id] }
      console.log(filters);
      bettings = await Transaction.find(filters).limit(perPage).skip(page * perPage).sort({
        _id: 'desc'
      }).populate('fromUser').populate('toUser').populate('game_history_id').exec();

      //return res.json(bettings);
      if (bettings.length) {
        for (let singleBet of bettings) {

          if (singleBet.game_history_id !== null) {
            if (userBettings[singleBet.game_history_id.id] == undefined) {
              userBettings[singleBet.game_history_id.id] = {};
            }

            if (singleBet.type == 'SUBTRACT') {


              if (userBettings[singleBet.game_history_id.id][singleBet.fromUser.id] == undefined) {
                userBettings[singleBet.game_history_id.id][singleBet.fromUser.id] = {};
              }

              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['betamount'] = parseFloat((singleBet.trans_coins).toFixed(2));
              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['startswith'] = parseFloat((singleBet.remaining_coins + singleBet.trans_coins).toFixed(2));
              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['start'] = singleBet.game_history_id.start;
              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['end'] = singleBet.game_history_id.end;
              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['game'] = singleBet.game_history_id.game;
              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['gameid'] = singleBet.game_history_id.id;
              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['username'] = singleBet.fromUser.username;
              userBettings[singleBet.game_history_id.id][singleBet.fromUser.id]['userid'] = singleBet.fromUser.id;

            } else if (singleBet.type == 'ADD') {

              if (userBettings[singleBet.game_history_id.id][singleBet.toUser.id] == undefined) {
                userBettings[singleBet.game_history_id.id][singleBet.toUser.id] = {};
              }

              userBettings[singleBet.game_history_id.id][singleBet.toUser.id]['winamount'] = parseFloat(singleBet.trans_coins.toFixed(2));
              userBettings[singleBet.game_history_id.id][singleBet.toUser.id]['winamount'] = parseFloat((userBettings[singleBet.game_history_id.id][singleBet.toUser.id]['winamount']).toFixed(2));
              //res.json(userBettings[singleBet.game_history_id.id][singleBet.toUser.id]['winamount']);
            }
          }

        }
      }
    }

    let resBettings = [];
    //return res.json(userBettings);
    for (let singleGameBet in userBettings) {
      for (let singleUserBet in userBettings[singleGameBet]) {
        if (userBettings[singleGameBet][singleUserBet]['winamount'] == undefined) {
          userBettings[singleGameBet][singleUserBet]['winamount'] = 0;
        }
        resBettings.push(userBettings[singleGameBet][singleUserBet]);

      }
    }

    let responseBetData = {};
    if (resBettings.length) {
      if (resBettings[resBettings.length - 1]['betamount'] == undefined) {
        responseBetData.minuspage = -1;
        resBettings.pop();
      }
    }


    responseBetData.bets = resBettings;

    return res.json(responseBetData);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});
// tambolabooking
router.post('/tambolabooking', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'betList');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {

    let settings = await settingsData();
    let rouleteGame = settings['ROLLETE_GAME_ID']
    let currGame = await crGame(rouleteGame);



    let lcGame = settings['Lucky_Card_GAME_ID']
    let currGameLc = await crGame(lcGame);


    const user = req.user;
    let reslt = 0;

    let filters = {};

    const ObjectId = require('mongoose').Types.ObjectId;

    let cuDate = new Date();
    cuDate.setHours(0, 0, 0, 0);

    let start = req.body.start ? new Date(req.body.start) : cuDate;
    let end = req.body.end ? new Date(req.body.end) : new Date();

    let unsername = req.body.username;
    let gameId = req.body.gamename;

    let currentWeekDay;
    let currentMonthDay;
    let daySelect = req.body.day;

    //current week
    if (daySelect == "today1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      start.setHours(0, 0, 0, 0);

    } else if (daySelect == "thisWeek1") {
      end = new Date();
      start = new Date();
      reslt = 1;


      currentWeekDay = end.getDay();

      if (currentWeekDay > 1) {
        currentWeekDay = currentWeekDay - 1;
      }

      start.setDate(start.getDate() - currentWeekDay);
      start.setHours(0, 0, 0, 0);

    } else if (daySelect == "lastWeek1") {
      end = new Date();
      start = new Date();

      currentWeekDay = end.getDay();
      end.setDate(end.getDate() - currentWeekDay);
      end.setHours(23, 59, 59, 999);

      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      reslt = 1;

    } else if (daySelect == "thisMonth1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      currentMonthDay = end.getDate();

      if (currentMonthDay > 1) {
        currentMonthDay = currentMonthDay - 1;
      }

      start.setDate(start.getDate() - currentMonthDay);

      start.setHours(0, 0, 0, 0);


    } else if (daySelect == "thisLastMonth1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      currentMonthDay = end.getDate();
      end.setDate(end.getDate() - currentMonthDay);
      end.setHours(23, 59, 59, 999);

      start.setDate(start.getDate() - currentMonthDay);
      start.setDate(start.getDate() + 1 - end.getDate());
      start.setHours(0, 0, 0, 0);


    }



    if (unsername && user.role.id != 3) {

      let selectUser = await User.findOne({
        'username': unsername
      }, '_id').exec();

      if (selectUser) {

        if (user.role.id == 2) {

          let allChildCheck = await treeUnderUser(user.id);

          if (!allChildCheck.includes(selectUser.id)) {

            response.message = 'user does not exist under this agent.js';
            return res.status(500).json({
              'message': 'user not found'
            });
          }
        }


        reslt = 1;
        filters.$or = [{
          toUser: ObjectId(selectUser.id),
          type: "ADD"
        },
        {
          fromUser: ObjectId(selectUser.id),
          type: "SUBTRACT"
        }
        ];

      }
    }



    reslt = 1;
    filters.createdAt = {
      $gte: start.toString(),
      $lte: end.toString()
    }



    if (gameId) {
      let selGame = await Game.findById({
        '_id': gameId
      }, '_id').exec();

      if (selGame) {
        reslt = 1;
        filters.game_id = selGame._id;
      }
    }



    if (user.role.id == 3) {
      filters.$or = [{
        toUser: ObjectId(user.id),
        type: "ADD"
      },
      {
        fromUser: ObjectId(user.id),
        type: "SUBTRACT"
      }
      ];
    }


    let allChild;
    if (user.role.id == 2 && !unsername) {
      allChild = await treeUnderUser(user.id);

      filters.$or = [{
        toUser: {
          $in: allChild
        },
        type: "ADD"
      },
      {
        fromUser: {
          $in: allChild
        },
        type: "SUBTRACT"
      }
      ];

    }


    let bettings = {};
    let userBettings = [];
    let transactions;
    let perPage = 100, page = parseInt(req.body.currentPage);
    if (reslt) {

      // 1. group by game history and user betamount total
      // 1. group by game history and user agr winstatus true to wiing ++ betamount total
      filters.game_history_id = {
        $type: "objectId",
       // $nin: [currGameLc.id, currGame.id]
      };

      filters.type = "SUBTRACT";

      //filters.game_history_id = { $nin: [currGameLc.id, currGame.id] }
      bettings = await Transaction.find(filters).limit(perPage).skip(page * perPage).sort({
        _id: 'desc'
      }).populate('fromUser').populate('toUser').populate('game_history_id').exec();

      //return res.json(bettings);

      if (bettings.length) {
        for (let singleBet of bettings) {

          if (singleBet.game_history_id !== null) {
            // if (userBettings[singleBet.game_history_id.id] == undefined) {
            //   userBettings[singleBet.game_history_id.id] = {};
            // }
            let tnsObject = {}

            let startWith = singleBet.type == 'SUBTRACT' ? parseFloat((singleBet.remaining_coins + singleBet.trans_coins).toFixed(2)) : parseFloat((singleBet.remaining_coins - singleBet.trans_coins).toFixed(2))
            
              tnsObject['amount'] = parseFloat((singleBet.trans_coins).toFixed(2)); 
              tnsObject['startswith'] = startWith;
              tnsObject['remaining'] = singleBet.remaining_coins;
              tnsObject['gamestart'] = singleBet.game_history_id.start;
              tnsObject['tnsdate'] = singleBet.createdAt;
              tnsObject['type'] = singleBet.type == 'ADD' ? 'Wining' : 'Booking'
              tnsObject['game'] = singleBet.game_history_id.game;
              tnsObject['gameid'] = singleBet.game_history_id.id;
              tnsObject['username'] = (singleBet?.fromUser?.username) ? singleBet?.fromUser?.username : (singleBet?.toUser?.username);
              tnsObject['userid'] = (singleBet?.fromUser?.id) ? singleBet?.fromUser?.id : (singleBet?.toUser?.id);
              tnsObject['comment'] = singleBet?.comment;

          
            userBettings.push(tnsObject)

          }

        }
      }
    }

    // let resBettings = [];
    // //return res.json(userBettings);
    // for (let singleGameBet in userBettings) {
    //   for (let singleUserBet in userBettings[singleGameBet]) {
    //     if (userBettings[singleGameBet][singleUserBet]['winamount'] == undefined) {
    //       userBettings[singleGameBet][singleUserBet]['winamount'] = 0;
    //     }
    //     resBettings.push(userBettings[singleGameBet][singleUserBet]);

    //   }
    // }

    let responseBetData = {};
    // if (resBettings.length) {
    //   if (resBettings[resBettings.length - 1]['betamount'] == undefined) {
    //     responseBetData.minuspage = -1;
    //     resBettings.pop();
    //   }
    // }


    responseBetData.bets = userBettings;

    return res.json(responseBetData);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    console.log(err);
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});



/**
 * Get the turnover by user wise.
 */
router.post('/turnover', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'turnover');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }


  try {
    const user = req.user;

    let reslt = 0;


    let filters = {};

    filters.status = "completed";

    const ObjectId = require('mongoose').Types.ObjectId;


    let cuDate = new Date();
    cuDate.setHours(0, 0, 0, 0)

    let start = req.body.start ? new Date(req.body.start) : cuDate;
    let end = req.body.end ? new Date(req.body.end) : new Date();
    let username = req.body.username;

    let currentWeekDay;
    let currentMonthDay;
    let daySelect = req.body.day;

    //current week
    if (daySelect == "today1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      start.setHours(0, 0, 0, 0);

    } else if (daySelect == "yesterday1") {
      end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);

      reslt = 1;
      start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);

    } else if (daySelect == "thisWeek1") {
      end = new Date();
      start = new Date();
      reslt = 1;


      currentWeekDay = end.getDay();

      if (currentWeekDay > 1) {
        currentWeekDay = currentWeekDay - 1;
      }

      start.setDate(start.getDate() - currentWeekDay);
      start.setHours(0, 0, 0, 0);

    } else if (daySelect == "lastWeek1") {
      end = new Date();
      start = new Date();

      currentWeekDay = end.getDay();
      end.setDate(end.getDate() - currentWeekDay);
      end.setHours(23, 59, 59, 999);

      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      reslt = 1;

    } else if (daySelect == "thisMonth1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      currentMonthDay = end.getDate();

      if (currentMonthDay > 1) {
        currentMonthDay = currentMonthDay - 1;
      }

      start.setDate(start.getDate() - currentMonthDay);

      start.setHours(0, 0, 0, 0);


    } else if (daySelect == "thisLastMonth1") {
      end = new Date();
      start = new Date();
      reslt = 1;
      currentMonthDay = end.getDate();
      end.setDate(end.getDate() - currentMonthDay);
      end.setHours(23, 59, 59, 999);

      start.setDate(start.getDate() - currentMonthDay);
      start.setDate(start.getDate() + 1 - end.getDate());
      start.setHours(0, 0, 0, 0);


    }

    let allChild;

    if (user.role.id == 2) {
      allChild = await treeUnderUser(user.id);
      filters.user = {
        $in: allChild
      }
    }


    if (user.role.id == 3) {
      filters.user = user.id;
    }

    let selectUser;

    if (username && user.role.id != 3) {

      selectUser = await User.findOne({
        'username': username
      }).populate('role').exec();

      if (selectUser) {

        if (user.role.id == 2) {

          if (!allChild.includes(selectUser.id)) {

            response.message = 'user does not exist under this agent.js';
            return res.status(500).json({
              'message': 'user not found'
            });
          }
        }


        reslt = 1;
        if (selectUser.role.id == 2) {
          allChild = await treeUnderUser(selectUser.id);
          filters.user = {
            $in: allChild
          }
        } else {
          filters.user = ObjectId(selectUser.id);
        }

      }
    }



    reslt = 1;
    filters.createdAt = {
      $gte: start.toString(),
      $lte: end.toString()
    }
    let bettings = {};
    let userBettings = {};
    let totalBet = 0;
    let totalWin = 0;
    let endTotal, margin, agentMargin;

    if (reslt) {

      // 1. group by game history and user betamount total
      // 1. group by game history and user agr winstatus true to wiing ++ betamount total

      bettings = await Betting.find(filters).sort({
        createdAt: 'desc'
      }).populate('user').populate('game_history').exec();

      if (user.role.id == 1 && !username) {
        let agents = await User.find({
          username: {
            $ne: 'admin'
          },
          parent: {
            $not: {
              $type: "objectId"
            }
          }
        }, '_id username commission').exec();


        for (let singleAgent of agents) {



          allChild = await treeUnderUser(singleAgent.id);


          for (let singleBet of bettings) {

            if (singleBet.user !== null && allChild.indexOf(singleBet.user.id) !== -1) {

              if (userBettings[singleAgent.id] === undefined) {
                userBettings[singleAgent.id] = {};
                userBettings[singleAgent.id]['betamount'] = 0;
                userBettings[singleAgent.id]['winamount'] = 0;
                userBettings[singleAgent.id]['username'] = singleAgent.username;
                userBettings[singleAgent.id]['userid'] = singleAgent.id;
                userBettings[singleAgent.id]['commission'] = singleAgent.commission;
              }


              userBettings[singleAgent.id]['betamount'] += singleBet.amount;
              totalBet += singleBet.amount;
              userBettings[singleAgent.id]['winamount'] += singleBet.win_status ? singleBet.winning : 0;
              totalWin += singleBet.win_status ? singleBet.winning : 0;
            }

          }
        }
        endTotal = totalBet - totalWin;
        endTotal = endTotal.toFixed(2)
        agentMargin = 0;

      } else {

        for (let singleBet of bettings) {


          if (singleBet.user !== null && singleBet.game_history !== null) {


            if (userBettings[singleBet.user.id] === undefined) {
              userBettings[singleBet.user.id] = {};
              userBettings[singleBet.user.id]['betamount'] = 0;
              userBettings[singleBet.user.id]['winamount'] = 0;
              userBettings[singleBet.user.id]['username'] = singleBet.user.username;
              userBettings[singleBet.user.id]['userid'] = singleBet.user.id;
              userBettings[singleBet.user.id]['commission'] = singleBet.user.commission;

            }
            userBettings[singleBet.user.id]['betamount'] += singleBet.amount;
            totalBet += singleBet.amount;
            userBettings[singleBet.user.id]['winamount'] += singleBet.win_status ? singleBet.winning : 0;
            totalWin += singleBet.win_status ? singleBet.winning : 0;
          }

          // if( userBettings[singleBet.user.id] !== undefined ) {

          //   userBettings[singleBet.user.id]['endtotal'] =  userBettings[singleBet.user.id]['betamount'] - userBettings[singleBet.user.id]['winamount']; 
          //   userBettings[singleBet.user.id]['margin'] = Math.round( userBettings[singleBet.user.id]['endtotal'] * (singleBet.commission / 100));
          // }
          endTotal = totalBet - totalWin;
          endTotal = endTotal.toFixed(2);
          margin = totalBet * (singleBet.user.commission !== undefined ? parseFloat(singleBet.user.commission) : parseFloat(user.commission)) / 100;
          margin = margin.toFixed(2);
        }

        if (selectUser) {
          agentMargin = totalBet * parseFloat(selectUser.commission / 100);
          agentMargin = agentMargin.toFixed(2);
        } else {
          agentMargin = totalBet * parseFloat(req.user.commission / 100);
          agentMargin = agentMargin.toFixed(2);
        }

      }
    }

    let resBettings = [];
    //return res.json(userBettings);
    for (let singleUserBet in userBettings) {
      userBettings[singleUserBet]['endPoint'] = userBettings[singleUserBet]['betamount'] - userBettings[singleUserBet]['winamount'];
      userBettings[singleUserBet]['margin'] = userBettings[singleUserBet]['betamount'] * (parseFloat(userBettings[singleUserBet]['commission']) / 100);
      userBettings[singleUserBet]['net'] = userBettings[singleUserBet]['endPoint'] - userBettings[singleUserBet]['margin'];
      userBettings[singleUserBet]['net'] = userBettings[singleUserBet]['net'].toFixed(2);
      userBettings[singleUserBet]['margin'] = userBettings[singleUserBet]['margin'].toFixed(2);

      resBettings.push(userBettings[singleUserBet]);

    }

    let bettingOut;

    bettingOut = {
      totalbet: totalBet,
      totalwin: totalWin,
      bettings: resBettings,
      endTotal: endTotal,
      agent: {
        agentName: req.body.username ? req.body.username : user.username,
        playpoint: totalBet,
        winPoint: totalWin,
        endTotal: endTotal,
        margin: agentMargin,
        net: endTotal - agentMargin
      }
    }

    res.json(bettingOut);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Get the user turnover by user wise.
 */
 router.post('/userturnover', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'userturnover');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }


  try {
    const user = req.user;

    let reslt = 0;


    let filters = {};

    filters.status = "completed";

    const ObjectId = require('mongoose').Types.ObjectId;


    let cuDate = new Date();
    cuDate.setHours(0, 0, 0, 0)

    let start = req.body.start ? new Date(req.body.start) : cuDate;
    let end = req.body.end ? new Date(req.body.end) : new Date();
    filters.user = user.id;

    let selectUser;

    reslt = 1;
    filters.createdAt = {
      $gte: start.toString(),
      $lte: end.toString()
    }
    let bettings = {};
    let userBettings = {};
    let totalBet = 0;
    let totalWin = 0;
    let endTotal, margin, agentMargin;

    if (reslt) {

      // 1. group by game history and user betamount total
      // 1. group by game history and user agr winstatus true to wiing ++ betamount total

      bettings = await Betting.find(filters).sort({
        createdAt: 'desc'
      }).populate('user').populate('game_history').exec();

        for (let singleBet of bettings) {


          if (singleBet.user !== null && singleBet.game_history !== null) {


            if (userBettings[singleBet.user.id] === undefined) {
              userBettings[singleBet.user.id] = {};
              userBettings[singleBet.user.id]['betamount'] = 0;
              userBettings[singleBet.user.id]['winamount'] = 0;
              userBettings[singleBet.user.id]['username'] = singleBet.user.username;
              userBettings[singleBet.user.id]['userid'] = singleBet.user.id;
              userBettings[singleBet.user.id]['commission'] = singleBet.user.commission;

            }
            userBettings[singleBet.user.id]['betamount'] += singleBet.amount;
            totalBet += singleBet.amount;
            userBettings[singleBet.user.id]['winamount'] += singleBet.win_status ? singleBet.winning : 0;
            totalWin += singleBet.win_status ? singleBet.winning : 0;
          }

          endTotal = totalBet - totalWin;
          endTotal = endTotal.toFixed(2);
          margin = totalBet * (singleBet.user.commission !== undefined ? parseFloat(singleBet.user.commission) : parseFloat(user.commission)) / 100;
          margin = margin.toFixed(2);
        }

        if (selectUser) {
          agentMargin = totalBet * parseFloat(selectUser.commission / 100);
          agentMargin = agentMargin.toFixed(2);
        } else {
          agentMargin = totalBet * parseFloat(req.user.commission / 100);
          agentMargin = agentMargin.toFixed(2);
        }

      
    }

    let resBettings = [];
    
    for (let singleUserBet in userBettings) {
      userBettings[singleUserBet]['endPoint'] = userBettings[singleUserBet]['betamount'] - userBettings[singleUserBet]['winamount'];
      userBettings[singleUserBet]['margin'] = userBettings[singleUserBet]['betamount'] * (parseFloat(userBettings[singleUserBet]['commission']) / 100);
      userBettings[singleUserBet]['net'] = userBettings[singleUserBet]['endPoint'] - userBettings[singleUserBet]['margin'];
      userBettings[singleUserBet]['net'] = userBettings[singleUserBet]['net'].toFixed(2);
      userBettings[singleUserBet]['margin'] = userBettings[singleUserBet]['margin'].toFixed(2);

      resBettings.push(userBettings[singleUserBet]);

    }

    let bettingOut;

    bettingOut = {
      // totalbet: totalBet,
      // totalwin: totalWin,
      // bettings: resBettings,
      // endTotal: endTotal,
        username: user.username,
        playpoint: totalBet,
        winPoint: totalWin,
        endTotal: endTotal,
        margin: agentMargin,
        net: endTotal - agentMargin,
    }

    res.json(bettingOut);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});


/**
 * Get bettings for user by user id.
 * Hint - Its use in User manage where we need a bettings of a user.
 */
router.get('/byuser/:userid/:currentPage', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'bettingsbyuser');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: 'Issue in betting by user request.',
  };

  try {
    // Get current user with role
    const user = await req.user.getUserWithRole(req.user);

    // Ask for this user bettings records
    const filterUserId = req.params.userid;

    // Set current user id
    let currentUserId = user._id;

    // Set current user role
    const currentUserRole = user.role.id;

    let bettings = [];
    let perPage = 20, page = parseInt(req.params.currentPage);

    // Query pass
    let pass = 0;

    // Restricted for customer
    if (currentUserRole == 3) {
      response.message = 'Your restricted to user this API.js';
    } else if (currentUserRole == 2) {
      let checkUserUnderloggedUser = await User.findOne({
        parent: ObjectId(currentUserId),
        _id: ObjectId(filterUserId)
      },
        '_id',
      ).exec();

      if (checkUserUnderloggedUser) {
        pass = 1;
      } else {
        response.message = 'This user is not under the current user..js';
      }
    } else if (currentUserRole == 1) {
      pass = 1;
    } else {
      response.message = 'Please assign any role to current user..js';
    }

    if (pass) {
      bettings = await Betting.find({
        user: ObjectId(filterUserId)
      })
        .sort({
          createdAt: 'desc'
        }).limit(perPage).skip(page * perPage)
        .populate('user')
        .populate('betting_type')
        .populate('game')
        .exec();

      response.message = '.js';
      response.status = 1;
      response.bettings = bettings;
    }

    res.status(response.status ? 200 : 500).json(response).end();

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    }).end();
  }
});

/**
 * Create new betting.
 */
router.post('/', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'addBet');

  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    status: 0,
    message: 'Issue in user inserting request',
  };

  // Validation applied
  const {
    error
  } = Joi.validate(req.body, insertRouletteBetting);
  if (error) {
    response.message = error.details[0].message;
    return res.status(500).json(response).end();

  }

  try {

    let gameHistory = await bettingAlowedGame(req.user.current_game);

    // Check current game
    if (gameHistory.length) {

      // Check user current coins
      let user = req.user;

      //   const agg = await Betting.aggregate([{
      //     $match: {
      //       user: ObjectId(user.id),
      //       game_history: ObjectId(gameHistory[0].id),
      //       status: 'completed'
      //     }
      //   },
      //   {
      //     $group: {
      //       _id: null,
      //       total: {
      //         $sum: "$amount"
      //       }
      //     }
      //   }
      // ], ).exec();

      // let maxBet;
      // if (agg.length > 0) {
      //   if (agg[0].total !== undefined) {
      //     maxBet = await settingsData('maximum_betting_amount');
      //     response.betTotal = agg[0].total + parseInt(req.body.amount);

      //     if( response.betTotal > maxBet ) {
      //       response.message = "You can not play more than " + maxBet + ' this amount..js';
      //       res.status(500).json(response).end();
      //     }

      //   }
      // }

      // Check user coins for betting
      if (user.coins >= req.body.amount) {
        // Get betting type id
        let bettingType = await BettingType.findById(req.body.betting_type);

        // If wrong betting type sent
        if (!bettingType) {
          response.message = "We don't have " + req.body.betting_type + ' this betting type..js';
          return res.status(500).json(response);
        }

        if (bettingType.count != req.body.numbers.length) {
          response.message = "Wrong Number Supplied";
          return res.status(500).json(response);
        }



        // Calculated winning amount
        let winning = bettingType.winning_x * req.body.amount;

        user.coins = user.coins - req.body.amount;
        user.betting_points = user.betting_points + req.body.amount;

        let day = new Date();

        if (user.play_point_update == day.getDay()) {
          user.daily_play_points += req.body.amount
        } else {
          user.daily_play_points = req.body.amount;
          user.play_point_update = day.getDay();
        }
        await user.save();

        // Create betting
        let betting = await Betting.create({
          name: req.body.name,
          amount: req.body.amount,
          numbers: req.body.numbers,
          winning: winning,
          win_status: false,
          user: user.id,
          betting_type: req.body.betting_type,
          game: user.current_game,
          tokens: req.body.tokens,
          game_history: gameHistory[0]._id,
          status: 'completed',
          games: req.body.games
        });

        if (betting) {
          response.status = 1;
          response.message = '.js';
          response.betting = betting.toJSON();

        } else {
          response.message = 'Issue in bet create query.js';
        }
      } else {
        response.message = 'Insufficent balance for betting..js';
      }
    } else {
      response.message = 'Betting has been closed for current game..js';
    }

    res.status(response.status ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({
      response
    });
  }
});

// Create bet print game
router.post('/printlcgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id, 'addBet');

  // if (permission.status == 0) {
  //   return res.status(403).json(permission);
  // }

  // Default response
  let response = {
    status: 0,
    message: 'Issue in user inserting request',
  };

  // Validation applied
  // const {
  //   error
  // } = Joi.validate(req.body, insertRouletteBetting);
  // if (error) {
  //   response.message = error.details[0].message;
  //   return res.status(500).json(response).end();

  // }

  try {

    let gameHistory = await bettingAlowedGame(req.user.current_game);

    // Check current game
    if (gameHistory.length) {

      // Check user current coins
      let user = req.user;


      let bettingTypes = await BettingType.find({'game': user.current_game});
      
      let betTypeCountWin = {};
      for (const bettingType of bettingTypes) {        
        betTypeCountWin[bettingType.id] = {};
        betTypeCountWin[bettingType.id]['count'] = bettingType.count;
        betTypeCountWin[bettingType.id]['winning_x'] = bettingType.winning_x; 
      }

      let newBets = [];
      let winning, sum = 0;

      let ticketId = await Betting.find({ ticket_id: { $ne: 0 }, ticket_id: {$exists: true} }).sort({ ticket_id: -1 }).limit(1).exec();

        let tmpTicketId = await settingsData('TICKET_ID');
        tmpTicketId = parseInt(tmpTicketId)

        if (ticketId.length) {
          tmpTicketId = ticketId[0].ticket_id + 1;
        }

      for (const singleBet of req.body.bets) {

        if (betTypeCountWin[singleBet.betting_type]['count'] != singleBet.numbers.length) {
          response.message = "Wrong Number Supplied";
          return res.status(500).json(response);
        }

        sum += parseInt(singleBet.amount);
        
        winning = betTypeCountWin[singleBet.betting_type]['winning_x'] * singleBet.amount;
        
        newBets.push({
          name: singleBet.name,
          amount: singleBet.amount,
          numbers: singleBet.numbers,
          winning: winning,
          win_status: false,
          user: user.id,
          betting_type: singleBet.betting_type,
          game: user.current_game,
          tokens: singleBet.tokens,
          game_history: gameHistory[0]._id,
          status: 'completed',
          ticket_id : tmpTicketId,
          localid : singleBet.localid
        });
      }

    // Check wallet 
      if( user.coins >= sum && sum > 0){
        
        await Betting.insertMany(newBets);
        user.coins = user.coins - sum;
        user.betting_points = user.betting_points + sum;
       

        let day = new Date();

        if (user.play_point_update == day.getDay()) {
          user.daily_play_points += sum;
          if (user.daily_play_points < 0) {
            user.daily_play_points = 0
          }
        } else {
          user.daily_play_points = sum;
          user.play_point_update = day.getDay();
        }
        await user.save();

        response.message = 'Bets created'
        response.ticket_id = tmpTicketId;
        response.drawid = gameHistory[0]._id;
        response.bets = newBets;
        response.drawtime = gameHistory[0].betting_allow_time;
        response.tickettime = new Date().toISOString();
        response.totalamount = sum;
        response.status = 1;

      } else {
        
        response.message = 'Insufficent balance for bettings..js';
      
      }
    } else {
      response.message = 'Betting has been closed for current game..js';
    }

    res.status(response.status ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({
      response
    });
  }
});

router.get('/double', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'editBet');

  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    let response = {
      status: 0,
      message: 'Double request failed',
    };

    // Current user id
    let user = req.user;

    // Check game allow for bettings
    const gameHistory = await bettingAlowedGame(user.current_game);

    if (gameHistory.length) {
      // Set current game id
      let gameHistoryId = gameHistory[0]._id;

      // Update all bettings
      let updateAllBettings = await Betting.find({
        user: user.id,
        game_history: gameHistoryId,
        status: 'completed',
      }).populate('betting_type').exec();

      // Check any betting exists
      if (updateAllBettings.length) {

        let bettingAmountTotal = 0;

        for (let sum of updateAllBettings) {
          bettingAmountTotal = bettingAmountTotal + sum.amount;
        }

        // let maxBet;
        // if (bettingAmountTotal > 0) {
        //     maxBet = await settingsData('maximum_betting_amount');
        //     if( (bettingAmountTotal * 2) > maxBet ) {
        //       response.message = "You can not play more than " + maxBet + ' this amount..js';
        //       return res.status(500).json(response);
        //     }
        //   }


        // Compare user coins for betting
        if (user.coins >= bettingAmountTotal) {

          user.coins = user.coins - bettingAmountTotal;
          user.betting_points = user.betting_points + bettingAmountTotal;

          let day = new Date();

          if (user.play_point_update == day.getDay()) {
            user.daily_play_points += bettingAmountTotal
          } else {
            user.daily_play_points = bettingAmountTotal;
            user.play_point_update = day.getDay();
          }
          await user.save();

          for (let element of updateAllBettings) {
            element.amount = element.amount * 2;
            element.winning = element.winning * 2;
            await element.save();
          }

          response.status = 1;
          response.message = 'Double request successfully processed.js';

        } else {
          response.message = 'Insuficent balance to place the bet..js';
        }
      } else {
        response.message = "You don't have any betting for double.";
      }
    } else {
      response.message = 'Betting has been closed..js';
    }

    res.status(response.status ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});

router.delete('/clear', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'editBet');

  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    let response = {
      status: 0,
      message: 'Clear request failed',
    };

    // Get current if game is allowed for bettings
    const gameHistory = await bettingAlowedGame(req.user.current_game)

    if (gameHistory.length) {

      //  Game History id
      let gameHistoryId = gameHistory[0]._id;
      let totalBettingAmount = 0;

      // Update all bettings
      let updateAllBettings = await Betting.find({
        user: ObjectId(req.user.id),
        game_history: ObjectId(gameHistoryId),
        status: 'completed',
      }).populate('betting_type').exec();

      if (updateAllBettings.length) {
        for (let element of updateAllBettings) {
          totalBettingAmount = totalBettingAmount + element.amount;
        }

        await Betting.deleteMany({
          user: ObjectId(req.user.id),
          game_history: ObjectId(gameHistoryId),
          status: 'completed',
        }).exec();

        let updatedUsr = req.user;
        updatedUsr.coins = updatedUsr.coins + totalBettingAmount;
        updatedUsr.betting_points = updatedUsr.betting_points - totalBettingAmount;

        let day = new Date();

        if (updatedUsr.play_point_update == day.getDay()) {
          updatedUsr.daily_play_points -= totalBettingAmount;
          if (updatedUsr.daily_play_points < 0) {
            updatedUsr.daily_play_points = 0
          }
        } else {
          updatedUsr.daily_play_points = totalBettingAmount;
          updatedUsr.play_point_update = day.getDay();
        }
        await updatedUsr.save();

        response.status = 1;
        response.message = 'All bet has been cleared.js';

      } else {

        response.message = 'No bet avalible for clear..js';
      }
    } else {
      response.message = 'Betting has been closed..js';
    }

    res.status(response.status ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});

router.get('/printdeletelcgame/:ticket_id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'editBet');

  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    let response = {
      status: 0,
      message: 'Clear request failed',
    };

    // Get current if game is allowed for bettings
    const gameHistory = await bettingAlowedGame(req.user.current_game)

    if (gameHistory.length) {

      //  Game History id
      let gameHistoryId = gameHistory[0]._id;
      let totalBettingAmount = 0;

      // Update all bettings
      let updateAllBettings = await Betting.find({
        user: ObjectId(req.user.id),
        game_history: ObjectId(gameHistoryId),
        ticket_id : req.params.ticket_id,
        status: 'completed',
      }).populate('betting_type').exec();

      if (updateAllBettings.length) {
        for (let element of updateAllBettings) {
          totalBettingAmount = totalBettingAmount + element.amount;
        }

        await Betting.updateMany({
          user: ObjectId(req.user.id),
          game_history: ObjectId(gameHistoryId),
          status: 'completed',
          ticket_id : req.params.ticket_id
        },{status:'cancelled'}).exec();

        let updatedUsr = req.user;
        updatedUsr.coins = updatedUsr.coins + totalBettingAmount;
        updatedUsr.betting_points = updatedUsr.betting_points - totalBettingAmount;

        let day = new Date();

        if (updatedUsr.play_point_update == day.getDay()) {
          updatedUsr.daily_play_points -= totalBettingAmount;
          if (updatedUsr.daily_play_points < 0) {
            updatedUsr.daily_play_points = 0
          }
        } else {
          updatedUsr.daily_play_points = totalBettingAmount;
          updatedUsr.play_point_update = day.getDay();
        }
        await updatedUsr.save();

        response.status = 1;
        response.message = 'Bets has been deleted for ticket id ' + req.params.ticket_id;

      } else {

        response.message = 'No bet avalible for delete..js';
      }
    } else {
      response.message = 'Betting has been closed..js';
    }

    res.status(response.status ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});

router.get('/repeat', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'addBet');

  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {

    let response = {
      status: 0,
      message: 'Repeat request failed',
    };

    // Current user id
    const userId = req.user.id;

    // Check game allow for bettings
    const gameHistory = await bettingAlowedGame(req.user.current_game);

    if (gameHistory.length) {

      // Set current game id
      let gameHistoryId = gameHistory[0]._id;

      // For last bet of current user
      let lastBetOfUser = await Betting.findOne({
        user: ObjectId(userId),
        game: ObjectId(req.user.current_game),
        status: 'completed'
      }, {
        _id: 0,
        game_history: 1
      })
        .sort({
          createdAt: 'desc'
        }).exec();

      if (lastBetOfUser) {

        if (gameHistoryId !== lastBetOfUser.game_history) {

          let allBets = [];

          let previousBettings = await Betting.find({
            user: userId,
            game_history: lastBetOfUser.game_history,
            status: 'completed',
          }).populate('betting_type').exec();




          // Check any betting exists
          if (previousBettings.length) {

            let bettingAmountTotal = 0;

            // Check user current coins
            let user = req.user;

            let allBettingsForInsert = [];
            for (let element of previousBettings) {
              bettingAmountTotal = bettingAmountTotal + element.amount;

              allBettingsForInsert.push({
                name: element.name,
                amount: element.amount,
                numbers: element.numbers,
                winning: element.amount * element.betting_type.winning_x,
                win_status: false,
                user: element.user,
                betting_type: element.betting_type.id,
                game: element.game,
                tokens: element.tokens,
                game_history: ObjectId(gameHistoryId),
                status: 'completed',
              });

            }

            // Compare user coins for betting
            if (user.coins >= bettingAmountTotal) {

              user.coins = user.coins - bettingAmountTotal;
              user.betting_points = user.betting_points + bettingAmountTotal;
              let day = new Date();

              if (user.play_point_update == day.getDay()) {
                user.daily_play_points += bettingAmountTotal
              } else {
                user.daily_play_points = bettingAmountTotal;
                user.play_point_update = day.getDay();
              }
              await user.save();

              allBets = await Betting.insertMany(allBettingsForInsert);

              response.bettings = allBets;


              response.status = 1;
              response.message = 'Repeat request successfully processed.js';
            } else {
              response.message = 'Insuficent balance to repeat the bet..js';
            }
          } else {
            response.message = "You don't have any betting for Repeat.";
          }
        } else {
          response.message = "You have already applied repeat.";
        }
      } else {
        response.message = "You don't find any betting with current user.";
      }
    } else {
      response.message = 'Betting has been closed..js';
    }

    res.status(response.status ? 200 : 500).json(response);
  } catch (err) {
    console.log(err)
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});

/**
 * Edit betting
 */
router.post('/update/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id, 'editBet');
  // if (permission.status == 0) {
  //   return res.status(403).json(permission);
  // }
  
  let response = {
    status: 0,
    message: 'Issue in betting by user request.',
  };


  try {

    let gameHistory = await bettingAlowedGame(req.user.current_game);

    if (gameHistory.length) {

      let gameHistoryId = gameHistory[0]._id;

      let betting = await Betting.findOne({
        _id: req.params.id,
        game_history: ObjectId(gameHistoryId),
        user: ObjectId(req.user.id),
        status: 'completed',
      }).populate('betting_type').exec();

      if (betting) {

        let amount = req.body.amount + betting.amount;

        let givenamount = req.body.amount;

        if (req.user.coins >= req.body.amount || req.body.amount < 0) {

          if (amount <= 0) {
            givenamount = 0 - betting.amount;
            await betting.remove();
            response.message = 'Bet deleted.js';

          } else {

            betting.amount = amount;
            betting.winning = betting.betting_type.winning_x * amount;
            betting.token = req.body.tokens;
            await betting.save();

            response.message = 'Bet has been updated.js';

          }

          req.user.betting_points = req.user.betting_points + givenamount;
          let day = new Date();

          if (req.user.play_point_update == day.getDay()) {
            req.user.daily_play_points += givenamount;

            if (req.user.daily_play_points < 0) {
              req.user.daily_play_points = 0
            }

          } else {

            req.user.daily_play_points = betting.amount;
            req.user.play_point_update = day.getDay();
          }

          req.user.coins = req.user.coins - givenamount;
          await req.user.save();
          response.status = 1;


        } else {
          response.message = 'Insufficent balance for bettings..js';
        }

      } else {
        response.message = "We don't have any betting with this id";

      }
    } else {
      response.message = 'No Game avalible for bettings.js';

    }

    res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    console.log(err)
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});

router.get('/rouletteuserbets', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id, 'bettingsbyuser');
  // if (permission.status == 0) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    status: 0,
    message: 'Issue in betting by user request.',
  };

  try {
    // Get current user with role
    const user = req.user;
    let rouleteGame = await settingsData('ROLLETE_GAME_ID')
    let gameHistory = await crGame(rouleteGame);

    if (gameHistory) {
      let bettings = await Betting.find({
        user: ObjectId(user._id),
        game_history: ObjectId(gameHistory._id),
        status: 'completed'
      })
        .sort({
          createdAt: 'desc'
        })
        .exec();

      response.message = 'Users Bettings Retrived.js';
      response.status = 1;
      response.bettings = bettings;

    } else {
      response.message = 'Game Not Available.js';
      response.status = 0;
    }

    res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

router.get('/lcarduserbets', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id, 'bettingsbyuser');
  // if (permission.status == 0) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    status: 0,
    message: 'Issue in betting by user request.',
  };

  try {
    // Get current user with role
    const user = req.user;
    let luckyCardGame = await settingsData('Lucky_Card_GAME_ID')
    let gameHistory = await crGame(luckyCardGame);

    if (gameHistory) {
      let bettings = await Betting.find({
        user: ObjectId(user._id),
        game_history: ObjectId(gameHistory._id),
        status: 'completed'
      })
        .sort({
          createdAt: 'desc'
        })
        .exec();

      response.message = 'Users Bettings Retrived.js';
      response.status = 1;
      response.bettings = bettings;

    } else {
      response.message = 'Game Not Available.js';
      response.status = 0;
    }

    res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});


/*
ticket claim update
 */
router.get('/claim/:ticket_id', requireJwtAuth, async (req, res) => {
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let response = {
    status: 0,
    message: 'Issue in betting by user request.',
  };

  try {
    // Get current user with role
    const user = req.user;
    let luckyCardGame = await settingsData('Lucky_Card_GAME_ID')

    let bettingsClaim = await Betting.updateMany({
      game: user.current_game,
      user: ObjectId(user.id),
      ticket_id: req.params.ticket_id,
      claim: false
    },
      { claim: true })
      .sort({ createdAt: 'desc' })
      .exec();

    res.json(bettingsClaim);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});


// Get lc print game
router.post('/lc/table', requireJwtAuth, async (req, res) => {
  
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let response = {
    status: 0,
    message: 'Issue in betting by user request.',
  };

  let numberOfRecordsPerPage = 300; 

  try {
    // Get current user with role
    const user = req.user;
    let end = new Date();
    let start = new Date();
    let currentWeekDay = end.getDay();
    let page =  req.body.page ? req.body.page : 0;

    if (currentWeekDay > 1) {
      currentWeekDay = currentWeekDay - 1;
    }

    start.setDate(start.getDate() - currentWeekDay);
    start.setHours(0, 0, 0, 0);

   

    let bettings = await Betting.find({
      'user': ObjectId(user.id),
      'createdAt': { '$gte': start, '$lte': end },
      'game':user.current_game,
	ticket_id: {  $ne: 0},
 	ticket_id: {$exists : true },
    }).populate('game_history').skip(page*numberOfRecordsPerPage).limit(numberOfRecordsPerPage).sort({'_id': -1} ).exec(); 

    let ticketBets = {};
    if (bettings.length) {
      for (let singleBet of bettings) {

        if (singleBet.ticket_id !== null) {
          if (ticketBets[singleBet.ticket_id] == undefined) {
            ticketBets[singleBet.ticket_id] = {};

            ticketBets[singleBet.ticket_id]['Barcode'] = singleBet.ticket_id;
            ticketBets[singleBet.ticket_id]['Draw_ID'] = singleBet.game_history.id;
            ticketBets[singleBet.ticket_id]['Play'] = 0;
            ticketBets[singleBet.ticket_id]['Win'] = 0;
            ticketBets[singleBet.ticket_id]['Claim'] = singleBet.claim;
            ticketBets[singleBet.ticket_id]['Result'] = singleBet.game_history.number ? parseInt(singleBet.game_history.number) : '.js';
            ticketBets[singleBet.ticket_id]['Jackpot'] = singleBet.game_history.jackpot;
            ticketBets[singleBet.ticket_id]['Ticket_Time'] = singleBet.createdAt;
            ticketBets[singleBet.ticket_id]['Claim_Time'] = singleBet.updatedAt;
            ticketBets[singleBet.ticket_id]['Draw_Time'] = singleBet.game_history.betting_allow_time;
            ticketBets[singleBet.ticket_id]['Cancel_Status'] = singleBet.status == "completed" ? false : true;
            ticketBets[singleBet.ticket_id]['Cancel_Time'] = singleBet.status == "completed" ? '' : singleBet.updatedAt;
            ticketBets[singleBet.ticket_id]['All_Bets'] = [];
          }

          ticketBets[singleBet.ticket_id]['Win'] += singleBet.win_status ? parseFloat(singleBet.winning) : 0;
          ticketBets[singleBet.ticket_id]['Play'] += parseFloat(singleBet.amount);
          ticketBets[singleBet.ticket_id]['All_Bets'].push(singleBet)
        }
	
      }
    } else {
      response.status = 0;
       response.message = 'No record found..js';
        return res.status(500).json(response);
      
    }


    let resBettings = [];
    for (let singleGameBet in ticketBets) {  
        resBettings.push(ticketBets[singleGameBet]);
    }
    resBettings.reverse();
    res.json(resBettings);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});


export default router;
