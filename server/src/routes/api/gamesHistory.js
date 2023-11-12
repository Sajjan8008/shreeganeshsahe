import {
  Router
} from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import GameHistory from '../../models/GameHistory.js';
import Betting from '../../models/Betting.js';
import Game from '../../models/Game.js';
import NumberBettingHistory from '../../models/NumberBettingHistory.js';
import {
  settingsData,
  crGame,
  verifyToken,
  checkpermission
} from '../../helper/common.js';
import 'dotenv';
const env = process.env;
// import {
//   single
// } from 'joi/lib/types/array.js';
import User from '../../models/User.js';
import PlayingData from '../../models/PlayingData.js';
import Room from '../../models/Room.js';
import Transaction from '../../models/Transaction.js';
import mongoose from 'mongoose';
const  ObjectId  = mongoose.Schema.Types.ObjectId;

const router = Router();


/***
 * Find game history by game
 */
router.get('/checkrelatedgames/:gameHistoryId', requireJwtAuth, async (req, res) => {

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in check related game Api.",
  };

  try {

    let gameHis = await GameHistory.findById({
      _id: req.params.gameHistoryId
    }).populate('game').exec();


    response.status = 1;
    response.message = '.js';
    response.game = gameHis.game.id;
    response.name = gameHis.game.name;
    response.start = gameHis.start;
    response.end = gameHis.end;

    res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {
    response.message = err.message || err.toString();
    res.status(500).json(response);
  }
});

/**
 * Filter
 */
router.post('/filter', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'getHistoryList');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {

    let filters = {};
    let reslt;

    let cuDate = new Date();
    cuDate.setHours(0,0,0,0);

    let start = req.body.start ? new Date(req.body.start) : cuDate;
    let end = req.body.end ? new Date(req.body.end) : new Date();
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


    let gameHistory = {};
    let perPage = 20, page = parseInt(req.body.currentPage);

    if (gameId) {
      let selGame = await Game.findById({
        '_id': gameId
      }, '_id').exec();

      if (selGame) {
        filters = {
          game: ObjectId(selGame._id)
        }
      }
    }
    filters.start = {
      $gte: start.toString(),
      $lte: end.toString()
    }

    filters.total_betting = {$gt : 0};  
    
    gameHistory = await GameHistory.find(filters).limit(perPage).skip(page*perPage).sort({
      createdAt: 'desc'
    }).exec();
    res.json(gameHistory);

  } catch (err) {
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});


// current game
router.get('/currentgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentgame');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in current game list.",
  };

  try {

    const setting = await settingsData('ROLLETE_GAME_ID')

    const originalGame = await crGame(setting);

    response.status = 1;
    response.message = '.js';
    response.currentgame = originalGame;
    response.counter = 0;

    if (originalGame) {

      let currentDateTime = new Date(); // current date
      let betAllowTime = new Date(originalGame.end); // mm/dd/yyyy format
      let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
      let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second


      if (timeDiffInSecond < 91 && timeDiffInSecond > 0) {
        response.counter = timeDiffInSecond;
      }
    } else {
      response.status = 0;
      response.message = 'Game is not available.js';
    }
    res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {

    response.message = err.message || err.toString();
    res.status(500).json(response);

  }
});

//lucky card current game
router.get('/lccurrentgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentgame');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in current game list.",
  };

  try {

    const lcsetting = await settingsData('Lucky_Card_GAME_ID')

    const originalGame = await crGame(lcsetting);

    response.status = 1;
    response.message = '.js';
    response.currentgame = originalGame;
    response.counter = 0;

    if (originalGame) {

      let currentDateTime = new Date(); // current date
      let betAllowTime = new Date(originalGame.end); // mm/dd/yyyy format
      let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
      let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second


      if (timeDiffInSecond < 106 && timeDiffInSecond > 0) {
        response.counter = timeDiffInSecond;
      }
    }else {
      response.status = 0;
      response.message = 'Game is not available.js';
    }
    res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {

    response.message = err.message || err.toString();
    res.status(500).json(response);

  }
});

/**
 *  Jhanda Munda Current Game
 */
router.get('/jhcurrentgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentgame');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in current game list.",
  };

  try {

    const setting = await settingsData('JH_GAME_ID')

    const jmGame = await crGame(setting);

    response.status = 1;
    response.message = '.js';
    response.currentgame = jmGame;
    response.counter = 0;

    if (jmGame) {

      let currentDateTime = new Date(); // current date
      let betAllowTime = new Date(jmGame.end); // mm/dd/yyyy format
      let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
      let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second


      if (timeDiffInSecond < 31 && timeDiffInSecond > 0) {
        response.counter = timeDiffInSecond;
      }
    }else {
      response.status = 0;
      response.message = 'Game is not available.js';
    }
    res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {

    response.message = err.message || err.toString();
    res.status(500).json(response);

  }
});

//52cards current game
router.get('/52cardscurrentgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentgame');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in current game list.",
  };

  try {

    const lcsetting = await settingsData('CARDSFIFTYTWO_GAME_ID')

    const originalGame = await crGame(lcsetting);

    response.status = 1;
    response.message = '.js';
    response.currentgame = originalGame;
    response.counter = 0;

    if (originalGame) {

      let currentDateTime = new Date(); // current date
      let betAllowTime = new Date(originalGame.end); // mm/dd/yyyy format
      let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
      let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second


      if (timeDiffInSecond < 106 && timeDiffInSecond > 0) {
        response.counter = timeDiffInSecond;
      }
    }else {
      response.status = 0;
      response.message = 'Game is not available.js';
    }
    res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {

    response.message = err.message || err.toString();
    res.status(500).json(response);

  }
});

//triple chance current game
router.get('/triplechancecurrentgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentgame');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in current game list.",
  };

  try {

    const lcsetting = await settingsData('TRIPLE_CHANCE_GAME_ID')

    const originalGame = await crGame(lcsetting);

    response.status = 1;
    response.message = '.js';
    response.currentgame = originalGame;
    response.counter = 0;

    if (originalGame) {

      let currentDateTime = new Date(); // current date
      let betAllowTime = new Date(originalGame.end); // mm/dd/yyyy format
      let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
      let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second


      if (timeDiffInSecond < 106 && timeDiffInSecond > 0) {
        response.counter = timeDiffInSecond;
      }
    }else {
      response.status = 0;
      response.message = 'Game is not available.js';
    }
    res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {

    response.message = err.message || err.toString();
    res.status(500).json(response);

  }
});

//triple chance current game
router.get('/spintowincurrentgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentgame');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in current game list.",
  };

  try {

    const lcsetting = await settingsData('SPIN_TO_WIN_GAME_ID')

    const originalGame = await crGame(lcsetting);

    response.status = 1;
    response.message = '.js';
    response.currentgame = originalGame;
    response.counter = 0;

    if (originalGame) {

      let currentDateTime = new Date(); // current date
      let betAllowTime = new Date(originalGame.end); // mm/dd/yyyy format
      let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
      let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second


      if (timeDiffInSecond < 106 && timeDiffInSecond > 0) {
        response.counter = timeDiffInSecond;
      }
    }else {
      response.status = 0;
      response.message = 'Game is not available.js';
    }
    res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {

    response.message = err.message || err.toString();
    res.status(500).json(response);

  }
});




/**
 * Roulette Todays total betting and winning 
 */
router.get('/todaystotal', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'todaytotal');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const rouletteSetting = await settingsData('ROLLETE_GAME_ID')

  try {
    let gameId = ObjectId(rouletteSetting);

    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);
    let d = new Date();

    let total = await GameHistory.aggregate([{
        $match: {
          'start': {
            $gte: start,
            $lt: end
          },
          game: gameId,
        }
      },
      {
        $group: {
          _id: null,
          total_betting: {
            $sum: '$total_betting'
          },
          total_winning: {
            $sum: '$total_winning'
          }
        }
      }
    ]).exec();

    let number = await GameHistory.find({
      game: gameId,
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(10).exec();


    res.status(200).json({
      total,
      number
    });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Current games teenpatti  
 */
// requireJwtAuth
 router.post('/gameteenpatti', requireJwtAuth, async (req, res) => {

  let response = {
    status : 0,
    message : 'Issue in game current teenpatti.'
  } ;
  
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentteenpatti');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  } 

  
  try {

    let min = req.body.minpotvalue == undefined ? 0 : parseFloat(req.body.minpotvalue);
    let max = req.body.maxpotvalue ==  undefined ? 0 : parseFloat(req.body.maxpotvalue);
  
    let playingsData = await PlayingData.find({}).populate('userid','name username').populate('roomid');


    if( playingsData.length ) {

      let runningGameRcords = {};

      for (const singlePlayerData of playingsData) {

        if(min) {

          if(singlePlayerData.roomid.potValue < min) {
            continue;
          }
        }

        if(max) {
          if(singlePlayerData.roomid.potValue > max) {
            continue;
          }
        }
        
        if( !(singlePlayerData.roomid.bootValue in runningGameRcords) ) {
          runningGameRcords[singlePlayerData.roomid.bootValue] = {};
          runningGameRcords[singlePlayerData.roomid.bootValue]['total'] = 0;
          runningGameRcords[singlePlayerData.roomid.bootValue]['tables'] = {} 
          
        }

        if( !(singlePlayerData.roomid.id in runningGameRcords[singlePlayerData.roomid.bootValue]['tables'])) {
          runningGameRcords[singlePlayerData.roomid.bootValue]['tables'][singlePlayerData.roomid.id] = [];
          runningGameRcords[singlePlayerData.roomid.bootValue]['total'] += 1;
        }
        
        runningGameRcords[singlePlayerData.roomid.bootValue]['tables'][singlePlayerData.roomid.id].push({
          'name' : singlePlayerData.userid.name,
          'totalbet': singlePlayerData.sumChaalValue,
          'status' : (singlePlayerData.watching  ? (singlePlayerData.packed ? 'Packed' : 'Watching') : 'Running')
        });  
      }

      response.status = 1;
      response.data = runningGameRcords;
      response.message = 'Live data comming.js';

    } else {

      response.status = 1;
      response.data = [];
      response.message = 'Currently no data found.js';
    }

    return res.json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      error: err.message || err.toString()
    });
  }
});


/**
 * Lucky Card Todays total betting and winning 
 */
router.get('/lctodaystotal', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'todaytotal');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const lcsetting = await settingsData('Lucky_Card_GAME_ID')

  try {

    let gameId = ObjectId(lcsetting)
    let d = new Date();
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);

    const total = await GameHistory.aggregate([{
        $match: {
          'start': {
            $gte: start,
            $lt: end
          },
          game: gameId
        }
      },
      {
        $group: {
          _id: null,
          total_betting: {
            $sum: '$total_betting'
          },
          total_winning: {
            $sum: '$total_winning'
          }
        }
      }
    ]).exec();

    let numbers = await GameHistory.find({
      game: gameId,
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(10).exec();

    

    res.status(200).json({
      total,
      numbers
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Lucky Card Todays total betting and winning 
 */

// requireJwtAuth

 router.get('/teenpattitodaystotal', async (req, res) => {

  /*let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'todaytotal');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  } */

  // Todo to change to get this thing form env
  const lcsetting = '62cfbc440651f156d74c1e97.js';

  try {

    let gameId = ObjectId(lcsetting)
    let d = new Date();
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);

    const total = await GameHistory.aggregate([{
        $match: {
          'start': {
            $gte: start,
            $lt: end
          },
          game: gameId
        }
      },
      {
        $group: {
          _id: null,
          total_betting: {
            $sum: '$total_betting'
          },
          total_winning: {
            $sum: '$total_winning'
          }
        }
      }
    ]).exec();

    res.status(200).json({
      total
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

// Dragpm vs tiger total betting
//
router.get('/dttodaystotal',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'todaytotal');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const lcsetting = await settingsData('DRAGON_VS_TIGER_ID');

  try {

    let gameId = ObjectId(lcsetting)
    let d = new Date();
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);

    const total = await GameHistory.aggregate([{
        $match: {
          'start': {
            $gte: start,
            $lt: end
          },
          game: gameId
        }
      },
      {
        $group: {
          _id: null,
          total_betting: {
            $sum: '$total_betting'
          },
          total_winning: {
            $sum: '$total_winning'
          }
        }
      }
    ]).exec();

    let numbers = await GameHistory.find({
      game: gameId,
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(10).exec();

    

    res.status(200).json({
      total,
      numbers
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

router.get('/spintowintodaystotal', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'todaytotal');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const lcsetting = await settingsData('SPIN_TO_WIN_GAME_ID')

  try {

    let gameId = ObjectId(lcsetting)
    let d = new Date();
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);

    const total = await GameHistory.aggregate([{
        $match: {
          'start': {
            $gte: start,
            $lt: end
          },
          game: gameId
        }
      },
      {
        $group: {
          _id: null,
          total_betting: {
            $sum: '$total_betting'
          },
          total_winning: {
            $sum: '$total_winning'
          }
        }
      }
    ]).exec();

    let numbers = await GameHistory.find({
      game: gameId,
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(10).exec();

    

    res.status(200).json({
      total,
      numbers
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Lucky Card Todays total betting and winning 
 */
 router.get('/52cardstodaystotal', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'todaytotal');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const lcsetting = await settingsData('CARDSFIFTYTWO_GAME_ID')

  try {

    let gameId = ObjectId(lcsetting)
    let d = new Date();
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);

    const total = await GameHistory.aggregate([{
        $match: {
          'start': {
            $gte: start,
            $lt: end
          },
          game: gameId
        }
      },
      {
        $group: {
          _id: null,
          total_betting: {
            $sum: '$total_betting'
          },
          total_winning: {
            $sum: '$total_winning'
          }
        }
      }
    ]).exec();

    let numbers = await GameHistory.find({
      game: gameId,
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(10).exec();

    

    res.status(200).json({
      total,
      numbers
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

router.get('/triplechancetodaystotal', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'todaytotal');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  const lcsetting = await settingsData('TRIPLE_CHANCE_GAME_ID')

  try {

    let gameId = ObjectId(lcsetting)
    let d = new Date();
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);

    const total = await GameHistory.aggregate([{
        $match: {
          'start': {
            $gte: start,
            $lt: end
          },
          game: gameId
        }
      },
      {
        $group: {
          _id: null,
          total_betting: {
            $sum: '$total_betting'
          },
          total_winning: {
            $sum: '$total_winning'
          }
        }
      }
    ]).exec();

    let numbers = await GameHistory.find({
      game: gameId,
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(10).exec();

    

    res.status(200).json({
      total,
      numbers
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

// current game
router.get('/getnumber', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'getNumber');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in get number request.",
  };

  try {

    let d = new Date();

    const currentgame = await GameHistory.find({
      game: ObjectId(req.user.current_game),
      'betting_allow_time': {
        $lt: d.toISOString()
      },
      'end': {
        $gt: d.toISOString()
      },
      "number": {
        $exists: true
      }
    }, 'number jackpot').exec();

    if (currentgame.length > 0) {

      let userId = req.user.id;


      let gameHistoryId = currentgame[0]._id;

      let bettingWinningTotal = 0;

      // Set number in response
      response.number = currentgame[0].number;
      response.gameid = currentgame[0]._id;
      response.jackpot = currentgame[0].jackpot;

      let bettingAmountTotal = await Betting.aggregate([{
          $match: {
            user: ObjectId(userId),
            game_history: ObjectId(gameHistoryId),
            status: 'completed',
            win_status: true
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$winning',
            },
          },
        },
      ]).exec();


      if (bettingAmountTotal.length > 0) {
        bettingWinningTotal = bettingAmountTotal[0].total;
      }

      response.status = 1;
      response.winning_total = bettingWinningTotal;
      response.message = "";
    } else {
      response.message = "No game available."

    }


    res.status(response.status == 1 ? 200 : 500).json(response);


  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json(response);

  }
});
// current game
router.get('/getlasttenresults',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  
  let permission = await checkpermission(req.user.role.id, 'last10Num');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }
  // Default response
  let response = {
    "responseStatus": 422,
    "status": 0,
    "message": "Issue in get number request.",
    "key": ""
  };

  let d = new Date();

  let numberOfRecords = 10;
  if(req.user.current_game == env.CARDSFIFTYTWO_GAME_ID) {
    numberOfRecords = 16;
  }

  try {

    let gameHistories = await GameHistory.find({
      game: ObjectId(req.user.current_game),
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(numberOfRecords).exec();

    if( req.user.current_game == env.TRIPLE_CHANCE_GAME_ID ) {
    
      if( gameHistories.length ) {
        let lastTenResData = []; 
        let triple,double,single,selectedNumber;
        for (let singleGame in gameHistories) {
          selectedNumber = ('000' + gameHistories[singleGame].number).slice(-3);
           triple = selectedNumber;
           double = String(selectedNumber).slice(-2);
           single = String(selectedNumber).slice(-1);
           lastTenResData[singleGame] = {};
           lastTenResData[singleGame].number = [triple,double,single]; 
           lastTenResData[singleGame].jackpot = gameHistories[singleGame].jackpot; 
           lastTenResData[singleGame].inner = parseInt(String(triple).slice(-1));
           lastTenResData[singleGame].middle = parseInt(String(triple).slice(1,-1));
           lastTenResData[singleGame].outside = parseInt(String(triple).slice(0,1));
        
          }

          return res.json(lastTenResData);

      }
    }

    res.json({
      numbers: gameHistories
    });

  } catch (err) {
    res.status(500).json({
      message: 'Issue in last ten results API.'
    });

  }
});

// Ladder bord API
/*
router.get('/ladderbord',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in get number request.",
    "key": ""
  };

  let d = new Date();

  let numberOfRecords = 20;
  
  try {


    //find({"winners.0" : { $exists: true }}).sort({"start": -1})

    let gameHistories = await GameHistory.find({
      "winners.0" : { $exists: true },
      'end': {
        $lte: d.toISOString()
      },
    } , {
      _id: 0,
      winners: 1,
    }).sort({
      updatedAt: -1
    }).limit(numberOfRecords);

    let winners = [];

    // db.getCollection("transactions").find({"type":"ADD", "game_history_id": {$exists: true}}).sort({createdAt:-1});


    if( gameHistories.length ) {
      let users = [], gameHistory = [];   
      for ( let singleGame of gameHistories ) {
          gameHistory.push(singleGame.id);
          for (const singleWin of singleGame.winners) {
            users.push( ObjectId( singleWin ) );
          }
        }

        await Transaction.find({"type": "ADD", "game_history_id" : {$in: gameHistory},"toUser" : {$in: users}});
      }
    

    res.json({
      numbers: gameHistories
    });

  } catch (err) {
    res.status(500).json({
      message: 'Issue in last ten results API.'
    });

  }
}); */

// current game
router.get('/getresultstranding', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'last10Num');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }
  // Default response
  let response = {
    "responseStatus": 422,
    "status": 0,
    "message": "Issue in get number request.",
    "key": ""
  };

  let d = new Date();

  try {

    let gameHistories = await GameHistory.find({
      game: req.user.current_game,
      'end': {
        $lte: d.toISOString()
      },
      number: {
        $exists: true
      }
    }, {
      _id: 0,
      number: 1,
      jackpot: 1
    }).sort({
      updatedAt: 'desc'
    }).limit(50).exec();

    res.json({
      numbers: gameHistories
    });

  } catch (err) {
    res.status(500).json({
      message: 'Issue in last tranding results API.'
    });

  }
});


// Dragon vs tiger current game
router.get('/dtcurrentgame', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'currentgame');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in current game list.",
  };

  try {

    const dtsetting = await settingsData('DRAGON_VS_TIGER_ID');

    const originalGame = await crGame(dtsetting);

    response.status = 1;
    response.message = '.js';
    response.currentgame = originalGame;
    response.counter = 0;

    if (originalGame) {

      let currentDateTime = new Date(); // current date
      let betAllowTime = new Date(originalGame.end); // mm/dd/yyyy format
      let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
      let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second


      if (timeDiffInSecond < 21 && timeDiffInSecond > 0) {
        response.counter = timeDiffInSecond;
      }
    }else {
      response.status = 0;
      response.message = 'Game is not available.js';
    }
    return res.status(response.status == 1 ? 200 : 500).json(response);

  } catch (err) {

    response.message = err.message || err.toString();
    return res.status(500).json(response);

  }
});



/**
 * Get the game history by game id
 */
router.get('/game/:gameId', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'getHistoryList');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    const gameHistories = await GameHistory.find({
      game: req.params.gameId
    }).sort({
      createdAt: 'desc'
    }).populate('game');

    res.json({
      gameHistories: gameHistories.map((m) => {
        return m.toJSON();
      }),
    });
  } catch (err) {

    res.status(500).json({
      message: 'Issue in games history API.'
    });
  }
});

/**
 * Get the Roulette board points game data
 */
router.get('/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'crgamelist');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: 'Issue in game borad request.'
  };

  let allNumber = {};

  let allNumberWinAmount = {};


  var bettingtypes = {};
  var users = {};

  try {

    let gameHistory;


    if (req.params.id == 'crgamelist') {
      let rouleteGame = await settingsData('ROLLETE_GAME_ID')
      gameHistory = await crGame(rouleteGame);

    } else {

      gameHistory = await GameHistory.findById(req.params.id);
    }

    let numbersWinBetAmount = [];
    if (gameHistory) {
      const numbers = await NumberBettingHistory.find({
        game_history_id: gameHistory.id
      }, {
        number: 1,
        betamount: 1,
        wincoins_if_draw_this_number: 1,
        _id: 0
      }).sort({
        wincoins_if_draw_this_number: "desc"
      }).exec();


      if (numbers.length) {

        for (let singleNumber of numbers) {
          allNumber[singleNumber.number] = singleNumber.betamount;
          allNumber[singleNumber.number] = allNumber[singleNumber.number].toFixed(2);
          allNumberWinAmount[singleNumber.number] = singleNumber.wincoins_if_draw_this_number;

          if (allNumber[singleNumber.number] == 0.00) {
            allNumber[singleNumber.number] = 0;
          }

          numbersWinBetAmount.push({
            number: singleNumber.number,
            betamount: singleNumber.betamount.toFixed(2),
            wincoins_if_draw_this_number: singleNumber.wincoins_if_draw_this_number,

          });
        }

        let bettings = await Betting.find({
          game_history: ObjectId(gameHistory.id),
          status: 'completed',
        }).populate('user').populate('betting_type').exec();

        if (bettings.length) {

          for (let singleBet of bettings) {

            if (bettingtypes[singleBet.betting_type.id] == undefined) {

              bettingtypes[singleBet.betting_type.id] = {};
              bettingtypes[singleBet.betting_type.id]['name'] = singleBet.betting_type.name;
              bettingtypes[singleBet.betting_type.id]['betamount'] = singleBet.amount;

            } else {

              bettingtypes[singleBet.betting_type.id]['betamount'] = bettingtypes[singleBet.betting_type.id]['betamount'] + singleBet.amount;

            }

            if (users[singleBet.user.id] == undefined) {

              users[singleBet.user.id] = {};
              users[singleBet.user.id]['username'] = singleBet.user.username;
              users[singleBet.user.id]['number'] = singleBet.numbers;
              users[singleBet.user.id]['betamount'] = singleBet.amount;
              users[singleBet.user.id]['winamount'] = singleBet.winning;
              users[singleBet.user.id]['daily_winning_points'] = singleBet.user.daily_winning_points;
              users[singleBet.user.id]['daily_play_points'] = singleBet.user.daily_play_points;
              users[singleBet.user.id]['winning'] = singleBet.user.winning;
              users[singleBet.user.id]['betting_points'] = singleBet.user.betting_points;
              
              users[singleBet.user.id]['numbers'] = {'00': 0,'0': 0,'1': 0,'2': 0,'3': 0,'4': 0,'5': 0,'6': 0,'7': 0,'8': 0,'9': 0,'10': 0,'11': 0,'12': 0,'13': 0,'14': 0,'15': 0,'16': 0,'17': 0,'18': 0,'19': 0,'20': 0,'21': 0,'22': 0,'23': 0,'24': 0,'25': 0,'26': 0,'27': 0,'28': 0,'29': 0,'30': 0,'31': 0,'32': 0,'33': 0,'34': 0,'35': 0,'36': 0};


            } else {
              users[singleBet.user.id]['betamount'] = users[singleBet.user.id]['betamount'] + singleBet.amount;
              users[singleBet.user.id]['winamount'] = users[singleBet.user.id]['winamount'] + singleBet.winning;
    //          users[singleBet.user.id]['number'] = users[singleBet.user.id]['number'].concat(singleBet.numbers);
            }

            let totalNumbersInBet = singleBet.numbers.length;

            if( totalNumbersInBet ) {
              for (let singleNumber of singleBet.numbers) {
  /*              users[singleBet.user.id]['numbers'][singleNumber] = users[singleBet.user.id]['betamount'] / totalNumbersInBet ;
                users[singleBet.user.id]['numbers'][singleNumber] = users[singleBet.user.id]['numbers'][singleNumber].toFixed(2);
*/
let previousAmount = parseFloat(users[singleBet.user.id]['numbers'][singleNumber]);
                users[singleBet.user.id]['numbers'][singleNumber] = parseFloat(previousAmount + parseFloat(parseInt(singleBet.amount) / totalNumbersInBet)).toFixed(2);
              }
            }


          }
        }

        response.bettingtypes = Object.values(bettingtypes);
        response.users = Object.values(users);
        response.numbers = allNumber;
        response.winamount_number = allNumberWinAmount;
        response.win_bet_amount = numbersWinBetAmount;
        response.totalbetamount = gameHistory.total_betting;
        response.totalwinning = gameHistory.total_winning;
        response.winningnumber = gameHistory.number;
        response.start = gameHistory.start;
        response.end = gameHistory.end;

        response.status = 1;
        response.message = "";

      } else {
        response.message = 'Not found any numbers with game history id.'
      }

    } else {

      response.message = 'Not found any game with game history id.'

    }

    return res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in game borad request.'
    });
  }
});


router.get('/lcard/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'crgamelist');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: 'Issue in game borad request.'
  };

  let allNumber = {};

  let allNumberWinAmount = {};


  var bettingtypes = {};
  var users = {};

  try {

    let gameHistory;

    if (req.params.id == 'crgamelist') {
      let rouleteGame = await settingsData('Lucky_Card_GAME_ID')
      gameHistory = await crGame(rouleteGame);

    } else {

      gameHistory = await GameHistory.findById(req.params.id);
    }

    let numbersWinBetAmount = [];
    if (gameHistory) {
      const numbers = await NumberBettingHistory.find({
        game_history_id: gameHistory.id
      }, {
        number: 1,
        betamount: 1,
        wincoins_if_draw_this_number: 1,
        _id: 0
      }).sort({
        wincoins_if_draw_this_number: "desc"
      }).exec();


      if (numbers.length) {

        for (let singleNumber of numbers) {
          allNumber[singleNumber.number] = singleNumber.betamount;
          allNumber[singleNumber.number] = allNumber[singleNumber.number].toFixed(2);

          if (allNumber[singleNumber.number] == 0.00) {
            allNumber[singleNumber.number] = 0;
          }
          allNumberWinAmount[singleNumber.number] = singleNumber.wincoins_if_draw_this_number;

          numbersWinBetAmount.push({
            number: singleNumber.number,
            betamount: singleNumber.betamount.toFixed(2),
            wincoins_if_draw_this_number: singleNumber.wincoins_if_draw_this_number,

          });

        }

        let bettings = await Betting.find({
          game_history: ObjectId(gameHistory.id),
          status: 'completed',
        }).populate('user').populate('betting_type').exec();

        if (bettings.length) {

          for (let singleBet of bettings) {

            if (bettingtypes[singleBet.betting_type.id] == undefined) {

              bettingtypes[singleBet.betting_type.id] = {};
              bettingtypes[singleBet.betting_type.id]['name'] = singleBet.betting_type.name;
              bettingtypes[singleBet.betting_type.id]['betamount'] = singleBet.amount;

            } else {

              bettingtypes[singleBet.betting_type.id]['betamount'] = bettingtypes[singleBet.betting_type.id]['betamount'] + singleBet.amount;

            }

            if (users[singleBet.user.id] == undefined) {

              users[singleBet.user.id] = {};
              users[singleBet.user.id]['username'] = singleBet.user.username;
              users[singleBet.user.id]['betamount'] = singleBet.amount;
              users[singleBet.user.id]['winamount'] = singleBet.winning;
              users[singleBet.user.id]['daily_winning_points'] = singleBet.user.daily_winning_points;
              users[singleBet.user.id]['daily_play_points'] = singleBet.user.daily_play_points;
              users[singleBet.user.id]['winning'] = singleBet.user.winning;
              users[singleBet.user.id]['betting_points'] = singleBet.user.betting_points;
              
              users[singleBet.user.id]['numbers'] = {'1': 0.00,'2': 0.00,'3': 0.00,'4': 0.00,'5': 0.00,'6': 0.00,'7': 0.00,'8': 0.00,'9': 0.00,'10': 0.00,'11': 0.00, '12': 0.00 };
              //Object.assign(users[singleBet.user.id]['numbers'], allNumberUsers);
              
           } else {
              users[singleBet.user.id]['betamount'] = users[singleBet.user.id]['betamount'] + singleBet.amount;
              users[singleBet.user.id]['winamount'] = users[singleBet.user.id]['winamount'] + singleBet.winning;
              //users[singleBet.user.id]['numbers'] += users[singleBet.user.id]['betamount'];
            }

            let totalNumbersInBet = singleBet.numbers.length;

            if( totalNumbersInBet ) {
              for (let singleNumber of singleBet.numbers) {
                
                let previousAmount = parseFloat(users[singleBet.user.id]['numbers'][singleNumber]);
                users[singleBet.user.id]['numbers'][singleNumber] = parseFloat(previousAmount + parseFloat(parseInt(singleBet.amount) / totalNumbersInBet)).toFixed(2);
                
              }
            }
          }
        }

        response.bettingtypes = Object.values(bettingtypes);
        response.users = Object.values(users);
        response.numbers = allNumber;
        response.winamount_number = allNumberWinAmount;
        response.win_bet_amount = numbers;
        response.totalbetamount = gameHistory.total_betting;
        response.totalwinning = gameHistory.total_winning;
        response.winningnumber = gameHistory.number;
        response.start = gameHistory.start;
        response.end = gameHistory.end;

        response.status = 1;
        response.message = "";

      } else {
        response.message = 'Not found any numbers with game history id.'
      }

    } else {

      response.message = 'Not found any game with game history id.'

    }

    return res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in game borad request.'
    });
  }
});

router.get('/dragontt/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'crgamelist');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: 'Issue in game borad request.'
  };

  let allNumber = {};

  let allNumberWinAmount = {};


  var bettingtypes = {};
  var users = {};

  try {

    let gameHistory;

    if (req.params.id == 'crgamelist') {
      let rouleteGame = await settingsData('DRAGON_VS_TIGER_ID')
      gameHistory = await crGame(rouleteGame);

    } else {

      gameHistory = await GameHistory.findById(req.params.id);
    }

    let numbersWinBetAmount = [];
    if (gameHistory) {
      const numbers = await NumberBettingHistory.find({
        game_history_id: gameHistory.id
      }, {
        number: 1,
        betamount: 1,
        wincoins_if_draw_this_number: 1,
        _id: 0
      }).sort({
        wincoins_if_draw_this_number: "desc"
      }).exec();


      if (numbers.length) {

        for (let singleNumber of numbers) {
          allNumber[singleNumber.number] = singleNumber.betamount;
          allNumber[singleNumber.number] = allNumber[singleNumber.number].toFixed(2);

          if (allNumber[singleNumber.number] == 0.00) {
            allNumber[singleNumber.number] = 0;
          }
          allNumberWinAmount[singleNumber.number] = singleNumber.wincoins_if_draw_this_number;

          numbersWinBetAmount.push({
            number: singleNumber.number,
            betamount: singleNumber.betamount.toFixed(2),
            wincoins_if_draw_this_number: singleNumber.wincoins_if_draw_this_number,

          });

        }

        let bettings = await Betting.find({
          game_history: ObjectId(gameHistory.id),
          status: 'completed',
        }).populate('user').populate('betting_type').exec();

        if (bettings.length) {

          for (let singleBet of bettings) {

            if (bettingtypes[singleBet.betting_type.id] == undefined) {

              bettingtypes[singleBet.betting_type.id] = {};
              bettingtypes[singleBet.betting_type.id]['name'] = singleBet.betting_type.name;
              bettingtypes[singleBet.betting_type.id]['betamount'] = singleBet.amount;

            } else {

              bettingtypes[singleBet.betting_type.id]['betamount'] = bettingtypes[singleBet.betting_type.id]['betamount'] + singleBet.amount;

            }

            if (users[singleBet.user.id] == undefined) {

              users[singleBet.user.id] = {};
              users[singleBet.user.id]['username'] = singleBet.user.username;
              users[singleBet.user.id]['betamount'] = singleBet.amount;
              users[singleBet.user.id]['winamount'] = singleBet.winning;
              users[singleBet.user.id]['daily_winning_points'] = singleBet.user.daily_winning_points;
              users[singleBet.user.id]['daily_play_points'] = singleBet.user.daily_play_points;
              users[singleBet.user.id]['winning'] = singleBet.user.winning;
              users[singleBet.user.id]['betting_points'] = singleBet.user.betting_points;
              
              users[singleBet.user.id]['numbers'] = { '1': 0.00,'2': 0.00,'3': 0.00 };
              //Object.assign(users[singleBet.user.id]['numbers'], allNumberUsers);
              
           } else {
              users[singleBet.user.id]['betamount'] = users[singleBet.user.id]['betamount'] + singleBet.amount;
              users[singleBet.user.id]['winamount'] = users[singleBet.user.id]['winamount'] + singleBet.winning;
              //users[singleBet.user.id]['numbers'] += users[singleBet.user.id]['betamount'];
            }

            let totalNumbersInBet = singleBet.numbers.length;

            if( totalNumbersInBet ) {
              for (let singleNumber of singleBet.numbers) {
                
                let previousAmount = parseFloat(users[singleBet.user.id]['numbers'][singleNumber]);
                users[singleBet.user.id]['numbers'][singleNumber] = parseFloat(previousAmount + parseFloat(parseInt(singleBet.amount) / totalNumbersInBet)).toFixed(2);
                
              }
            }
          }
        }

        response.bettingtypes = Object.values(bettingtypes);
        response.users = Object.values(users);
        response.numbers = allNumber;
        response.winamount_number = allNumberWinAmount;
        response.win_bet_amount = numbers;
        response.totalbetamount = gameHistory.total_betting;
        response.totalwinning = gameHistory.total_winning;
        response.winningnumber = gameHistory.number;
        response.start = gameHistory.start;
        response.end = gameHistory.end;

        response.status = 1;
        response.message = "";

      } else {
        response.message = 'Not found any numbers with game history id.'
      }

    } else {

      response.message = 'Not found any game with game history id.'

    }

    return res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in game borad request.'
    });
  }
});

router.get('/spin2win/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'crgamelist');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: 'Issue in game borad request.'
  };

  let allNumber = {};

  let allNumberWinAmount = {};


  var bettingtypes = {};
  var users = {};

  try {

    let gameHistory;

    if (req.params.id == 'crgamelist') {
      let rouleteGame = await settingsData('SPIN_TO_WIN_GAME_ID')
      gameHistory = await crGame(rouleteGame);

    } else {

      gameHistory = await GameHistory.findById(req.params.id);

    }

    let numbersWinBetAmount = [];
    if (gameHistory) {
      const numbers = await NumberBettingHistory.find({
        game_history_id: gameHistory.id
      }, {
        number: 1,
        betamount: 1,
        wincoins_if_draw_this_number: 1,
        _id: 0
      }).sort({
        wincoins_if_draw_this_number: "desc"
      }).exec();


      if (numbers.length) {

        for (let singleNumber of numbers) {
          allNumber[singleNumber.number] = singleNumber.betamount;
          allNumber[singleNumber.number] = allNumber[singleNumber.number].toFixed(2);

          if (allNumber[singleNumber.number] == 0.00) {
            allNumber[singleNumber.number] = 0;
          }
          allNumberWinAmount[singleNumber.number] = singleNumber.wincoins_if_draw_this_number;

          numbersWinBetAmount.push({
            number: singleNumber.number,
            betamount: singleNumber.betamount.toFixed(2),
            wincoins_if_draw_this_number: singleNumber.wincoins_if_draw_this_number,

          });

        }

        let bettings = await Betting.find({
          game_history: ObjectId(gameHistory.id),
          status: 'completed',
        }).populate('user').populate('betting_type').exec();

        if (bettings.length) {

          for (let singleBet of bettings) {

            if (bettingtypes[singleBet.betting_type.id] == undefined) {

              bettingtypes[singleBet.betting_type.id] = {};
              bettingtypes[singleBet.betting_type.id]['name'] = singleBet.betting_type.name;
              bettingtypes[singleBet.betting_type.id]['betamount'] = singleBet.amount;
             
            } else {

              bettingtypes[singleBet.betting_type.id]['betamount'] = bettingtypes[singleBet.betting_type.id]['betamount'] + singleBet.amount;

            }

            if (users[singleBet.user.id] == undefined) {

              users[singleBet.user.id] = {};
              users[singleBet.user.id]['username'] = singleBet.user.username;
              users[singleBet.user.id]['betamount'] = singleBet.amount;
              users[singleBet.user.id]['winamount'] = singleBet.winning;
              users[singleBet.user.id]['daily_winning_points'] = singleBet.user.daily_winning_points;
              users[singleBet.user.id]['daily_play_points'] = singleBet.user.daily_play_points;
              users[singleBet.user.id]['winning'] = singleBet.user.winning;
              users[singleBet.user.id]['betting_points'] = singleBet.user.betting_points;

              users[singleBet.user.id]['numbers'] = {'0': 0.00, '1': 0.00,'2': 0.00,'3': 0.00,'4': 0.00,'5': 0.00,'6': 0.00,'7': 0.00,'8': 0.00,'9': 0.00 };
              //Object.assign(users[singleBet.user.id]['numbers'], allNumberUsers);
              
           } else {
              users[singleBet.user.id]['betamount'] = users[singleBet.user.id]['betamount'] + singleBet.amount;
              users[singleBet.user.id]['winamount'] = users[singleBet.user.id]['winamount'] + singleBet.winning;
              //users[singleBet.user.id]['numbers'] += users[singleBet.user.id]['betamount'];
            }

            let totalNumbersInBet = singleBet.numbers.length;

            if( totalNumbersInBet ) {
              for (let singleNumber of singleBet.numbers) {
                
                let previousAmount = parseFloat(users[singleBet.user.id]['numbers'][singleNumber]);
                users[singleBet.user.id]['numbers'][singleNumber] = parseFloat(previousAmount + parseFloat(parseInt(singleBet.amount) / totalNumbersInBet)).toFixed(2);
                
              }
            }
          }
        }

        response.bettingtypes = Object.values(bettingtypes);
        response.users = Object.values(users);
        response.numbers = allNumber;
        response.winamount_number = allNumberWinAmount;
        response.win_bet_amount = numbers;
        response.totalbetamount = gameHistory.total_betting;
        response.totalwinning = gameHistory.total_winning;
        response.winningnumber = gameHistory.number;
        response.start = gameHistory.start;
        response.end = gameHistory.end;

        response.status = 1;
        response.message = "";

      } else {
        response.message = 'Not found any numbers with game history id.'
      }

    } else {

      response.message = 'Not found any game with game history id.'

    }

    return res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in game borad request.'
    });
  }
});

router.get('/52card/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'crgamelist');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: 'Issue in game borad request.'
  };

  let allNumber = {};

  let allNumberWinAmount = {};


  var bettingtypes = {};
  var users = {};

  try {

    let gameHistory;

    if (req.params.id == 'crgamelist') {
      let rouleteGame = await settingsData('CARDSFIFTYTWO_GAME_ID')
      gameHistory = await crGame(rouleteGame);

    } else {

      gameHistory = await GameHistory.findById(req.params.id);
    }

    let numbersWinBetAmount = [];
    if (gameHistory) {
      const numbers = await NumberBettingHistory.find({
        game_history_id: gameHistory.id
      }, {
        number: 1,
        betamount: 1,
        wincoins_if_draw_this_number: 1,
        _id: 0
      }).sort({
        wincoins_if_draw_this_number: "desc"
      }).exec();


      if (numbers.length) {

        for (let singleNumber of numbers) {
          allNumber[singleNumber.number] = singleNumber.betamount;
          allNumber[singleNumber.number] = allNumber[singleNumber.number].toFixed(2);

          if (allNumber[singleNumber.number] == 0.00) {
            allNumber[singleNumber.number] = 0;
          }
          allNumberWinAmount[singleNumber.number] = singleNumber.wincoins_if_draw_this_number;

          numbersWinBetAmount.push({
            number: singleNumber.number,
            betamount: singleNumber.betamount.toFixed(2),
            wincoins_if_draw_this_number: singleNumber.wincoins_if_draw_this_number,

          });

        }

        let bettings = await Betting.find({
          game_history: ObjectId(gameHistory.id),
          status: 'completed',
        }).populate('user').populate('betting_type').exec();

        if (bettings.length) {

          for (let singleBet of bettings) {

            if (bettingtypes[singleBet.betting_type.id] == undefined) {

              bettingtypes[singleBet.betting_type.id] = {};
              bettingtypes[singleBet.betting_type.id]['name'] = singleBet.betting_type.name;
              bettingtypes[singleBet.betting_type.id]['betamount'] = singleBet.amount;

            } else {

              bettingtypes[singleBet.betting_type.id]['betamount'] = bettingtypes[singleBet.betting_type.id]['betamount'] + singleBet.amount;

            }

            if (users[singleBet.user.id] == undefined) {

              users[singleBet.user.id] = {};
              users[singleBet.user.id]['username'] = singleBet.user.username;
              users[singleBet.user.id]['betamount'] = singleBet.amount;
              users[singleBet.user.id]['winamount'] = singleBet.winning;
              users[singleBet.user.id]['daily_winning_points'] = singleBet.user.daily_winning_points;
              users[singleBet.user.id]['daily_play_points'] = singleBet.user.daily_play_points;
              users[singleBet.user.id]['winning'] = singleBet.user.winning;
              users[singleBet.user.id]['betting_points'] = singleBet.user.betting_points;

              users[singleBet.user.id]['numbers'] = {'1': 0.00,'2': 0.00,'3': 0.00,'4': 0.00,'5': 0.00,'6': 0.00,'7': 0.00,'8': 0.00,'9': 0.00,'10': 0.00,'11': 0.00, '12': 0.00, 
              '13': 0.00,'14': 0.00,'15': 0.00,'16': 0.00,'17': 0.00,'18': 0.00,'19': 0.00,'20': 0.00,'21': 0.00,'22': 0.00,'23': 0.00, '24': 0.00,
              '25': 0.00,'26': 0.00,'27': 0.00,'28': 0.00,'29': 0.00,'30': 0.00,'31': 0.00,'32': 0.00,'33': 0.00,'34': 0.00,'35': 0.00, '36': 0.00, 
              '37': 0.00,'38': 0.00,'39': 0.00,'40': 0.00,'41': 0.00,'42': 0.00,'43': 0.00,'44': 0.00,'45': 0.00,'46': 0.00,'47': 0.00, '48': 0.00,
              '49': 0.00,'50': 0.00,'51': 0.00, '52': 0.00 };
              //Object.assign(users[singleBet.user.id]['numbers'], allNumberUsers);
              
           } else {
              users[singleBet.user.id]['betamount'] = users[singleBet.user.id]['betamount'] + singleBet.amount;
              users[singleBet.user.id]['winamount'] = users[singleBet.user.id]['winamount'] + singleBet.winning;
              //users[singleBet.user.id]['numbers'] += users[singleBet.user.id]['betamount'];
            }

            let totalNumbersInBet = singleBet.numbers.length;

            if( totalNumbersInBet ) {
              for (let singleNumber of singleBet.numbers) {
                
                let previousAmount = parseFloat(users[singleBet.user.id]['numbers'][singleNumber]);
                users[singleBet.user.id]['numbers'][singleNumber] = parseFloat(previousAmount + parseFloat(parseInt(singleBet.amount) / totalNumbersInBet)).toFixed(2);
                
              }
            }
          }
        }

        response.bettingtypes = Object.values(bettingtypes);
        response.users = Object.values(users);
        response.numbers = allNumber;
        response.winamount_number = allNumberWinAmount;
        response.win_bet_amount = numbers;
        response.totalbetamount = gameHistory.total_betting;
        response.totalwinning = gameHistory.total_winning;
        response.winningnumber = gameHistory.number;
        response.start = gameHistory.start;
        response.end = gameHistory.end;

        response.status = 1;
        response.message = "";

      } else {
        response.message = 'Not found any numbers with game history id.'
      }

    } else {

      response.message = 'Not found any game with game history id.'

    }

    return res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in game borad request.'
    });
  }
});

router.get('/triplechance/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'crgamelist');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: 'Issue in game borad request.'
  };

  let allNumber = {};

  let allNumberWinAmount = {};


  var bettingtypes = {};
  var users = {};

  try {

    let gameHistory;

    if (req.params.id == 'crgamelist') {
      let rouleteGame = await settingsData('TRIPLE_CHANCE_GAME_ID')
      gameHistory = await crGame(rouleteGame);

    } else {

      gameHistory = await GameHistory.findById(req.params.id);
    }

    let numbersWinBetAmount = [];
    if (gameHistory) {
      const numbers = await NumberBettingHistory.find({
        game_history_id: gameHistory.id
      }, {
        number: 1,
        betamount: 1,
        wincoins_if_draw_this_number: 1,
        _id: 0
      }).sort({
        wincoins_if_draw_this_number: "desc"
      }).exec();


      if (numbers.length) {

        for (let singleNumber of numbers) {
          
          if(!(singleNumber.number in allNumber)) {
            allNumber[singleNumber.number] = 0;
          }
          
          allNumber[singleNumber.number] = singleNumber.betamount;
          allNumber[singleNumber.number] = allNumber[singleNumber.number].toFixed(2);

          if (allNumber[singleNumber.number] == 0.00) {
            allNumber[singleNumber.number] = 0;
          }
          allNumberWinAmount[singleNumber.number] = singleNumber.wincoins_if_draw_this_number;

          numbersWinBetAmount.push({
            number: singleNumber.number,
            betamount: singleNumber.betamount.toFixed(2),
            wincoins_if_draw_this_number: singleNumber.wincoins_if_draw_this_number,

          });

        }

        let bettings = await Betting.find({
          game_history: ObjectId(gameHistory.id),
          status: 'completed',
        }).populate('user').populate('betting_type').exec();

        if (bettings.length) {

          for (let singleBet of bettings) {

            if (bettingtypes[singleBet.betting_type.id] == undefined) {

              bettingtypes[singleBet.betting_type.id] = {};
              bettingtypes[singleBet.betting_type.id]['name'] = singleBet.betting_type.name;
              bettingtypes[singleBet.betting_type.id]['betamount'] = singleBet.amount;

            } else {

              bettingtypes[singleBet.betting_type.id]['betamount'] = bettingtypes[singleBet.betting_type.id]['betamount'] + singleBet.amount;

            }

            if (users[singleBet.user.id] == undefined) {

              users[singleBet.user.id] = {};
              users[singleBet.user.id]['username'] = singleBet.user.username;
              users[singleBet.user.id]['betamount'] = singleBet.amount;
              users[singleBet.user.id]['winamount'] = singleBet.winning;
              users[singleBet.user.id]['daily_winning_points'] = singleBet.user.daily_winning_points;
              users[singleBet.user.id]['daily_play_points'] = singleBet.user.daily_play_points;
              users[singleBet.user.id]['winning'] = singleBet.user.winning;
              users[singleBet.user.id]['betting_points'] = singleBet.user.betting_points;
              
              users[singleBet.user.id]['numbers'] = {};
              
           } else {
              users[singleBet.user.id]['betamount'] = users[singleBet.user.id]['betamount'] + singleBet.amount;
              users[singleBet.user.id]['winamount'] = users[singleBet.user.id]['winamount'] + singleBet.winning;
              //users[singleBet.user.id]['numbers'] += users[singleBet.user.id]['betamount'];
            }

            let totalNumbersInBet = singleBet.numbers.length;

            if( totalNumbersInBet ) {
              for (let singleNumber of singleBet.numbers) {
                
                if(users[singleBet.user.id]['numbers'][singleNumber] == undefined ){
                  users[singleBet.user.id]['numbers'][singleNumber] = 0.00;
                }

                let previousAmount = parseFloat(users[singleBet.user.id]['numbers'][singleNumber]);
                users[singleBet.user.id]['numbers'][singleNumber] = parseFloat(previousAmount + parseFloat(parseInt(singleBet.amount) / totalNumbersInBet)).toFixed(2);
                
              }
            }
          }
        }

        response.bettingtypes = Object.values(bettingtypes);
        response.users = Object.values(users);
        response.numbers = allNumber;
        response.winamount_number = allNumberWinAmount;
        response.win_bet_amount = numbers;
        response.totalbetamount = gameHistory.total_betting;
        response.totalwinning = gameHistory.total_winning;
        response.winningnumber = gameHistory.number;
        response.start = gameHistory.start;
        response.end = gameHistory.end;

        response.status = 1;
        response.message = "";

      } else {

        response.bettingtypes = [];
        response.users = [];
        response.numbers = [];
        response.winamount_number = [];
        response.win_bet_amount = [];
        response.totalbetamount = gameHistory.total_betting;
        response.totalwinning = gameHistory.total_winning;
        response.winningnumber = gameHistory.number;
        response.start = gameHistory.start;
        response.end = gameHistory.end;
        response.status = 1;
        response.message = "";
      
      }

    } else {

      response.message = 'Not found any game with game history id.'

    }

    return res.status(response.status ? 200 : 500).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in game borad request.'
    });
  }
});

/**
 * Get the user specific game history data
 */
router.get('/usergamehistory/:userid/:gamehistoryid', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'getHistoryList');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status: 0,
    message: ""
  };

  let allNumber = {
    '00': 0,
    '0': 0,
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0,
    '7': 0,
    '8': 0,
    '9': 0,
    '10': 0,
    '11': 0,
    '12': 0,
    '13': 0,
    '14': 0,
    '15': 0,
    '16': 0,
    '17': 0,
    '18': 0,
    '19': 0,
    '20': 0,
    '21': 0,
    '22': 0,
    '23': 0,
    '24': 0,
    '25': 0,
    '26': 0,
    '27': 0,
    '28': 0,
    '29': 0,
    '30': 0,
    '31': 0,
    '32': 0,
    '33': 0,
    '34': 0,
    '35': 0,
    '36': 0,
    '37': 0,
    '38': 0,
    '39': 0,
    '40': 0,
    '41': 0,
    '42': 0,
    '43': 0,
    '44': 0,
    '45': 0,
    '46': 0,
    '47': 0,
    '48': 0,
    '49': 0,
    '50': 0,
    '51': 0,
    '52': 0
  };

  var bettingtypes = {};
  let betAmountTotal = 0;
  let selectedNumber = '.js';
  let totalWin = 0;
  let jackpotX;

  try {

    const bettings = await Betting.find({
      game_history: ObjectId(req.params.gamehistoryid),
      user: ObjectId(req.params.userid),
      status: 'completed'
    }).populate('betting_type').populate('game_history').exec();


    if (bettings.length) {

      if(bettings[0].game == env.TRIPLE_CHANCE_GAME_ID) {
        allNumber = {};
      }

      for (let singleBet of bettings) {

        if (singleBet.win_status) {
          totalWin += singleBet.winning;
        }


        for (let singleNumber of singleBet.numbers) {
          if(!(singleNumber in allNumber)) {
            allNumber[singleNumber] = 0;
          }
          allNumber[singleNumber] = parseFloat(allNumber[singleNumber]) + parseFloat(singleBet.amount / singleBet.betting_type.count)
          allNumber[singleNumber] = allNumber[singleNumber].toFixed(2);
        }

        if (bettingtypes[singleBet.betting_type.name] !== undefined) {
          bettingtypes[singleBet.betting_type.name] = bettingtypes[singleBet.betting_type.name] + singleBet.amount;
        } else {

          bettingtypes[singleBet.betting_type.name] = singleBet.amount;

        }

        betAmountTotal += singleBet.amount;

        if (!selectedNumber) {
          selectedNumber = singleBet.game_history.number;
          jackpotX = singleBet.game_history.jackpot;
        }

      }
    }

    response.status = 1;
    response.message = "";
    response.bettingtypes = bettingtypes;
    response.numbers = allNumber;
    response.betTotal = betAmountTotal;
    response.winningNumber = selectedNumber;
    response.winning = totalWin;
    response.jackpot = jackpotX + 'x.js';

    return res.json(response);

  } catch (err) {
    res.status(500).json({
      message: 'Issue in single game API.'
    });
  }
});

export default router;
