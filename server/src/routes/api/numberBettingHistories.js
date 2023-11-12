import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import NumberBettingHistory from '../../models/NumberBettingHistory.js';
import { settingsData, verifyToken,bettingAlowedGame, checkpermission } from '../../helper/common.js';
import GameHistory from '../../models/GameHistory.js';
import NumberSet from '../../models/NumberSet.js';
const  ObjectId  = mongoose.Schema.Types.ObjectId;
import mongoose from 'mongoose';
const router = Router();


// Roulette draw number
router.post('/drawnumber',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawNumber');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Already updated"
  }

  const user = req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {

    let number = req.body.number;

    
    if( number ) {
      let settings = await settingsData();

      let d = new Date();
      d.setSeconds( d.getSeconds() + 2 );
      

      let gameHistory = await GameHistory.findOne({
        game: ObjectId(settings['ROLLETE_GAME_ID']) , betting_allow_time: { $gte: d.toISOString() },
        end: { $gt: d.toISOString() },
        number : { $exists : false }
      }).exec();

      if( gameHistory ) {
       let update =  await NumberSet.updateOne({
          'gameid': 'roulette'}, {'number' : number});

      response.status = 1;
      response.message = 'Updated number..js';
    } 

    }

    res.status(response.status ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, {metadata: err});  
    response.message = err.message || err.toString();
    res.status(500).json({ response });
  }
});

// Roulette Draw Jackpot
router.post('/drawjackpot',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawJackpot');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Issue in Roulette Drawjackpot request"
  }

  const user = await req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {
    let gameId = await settingsData('ROLLETE_GAME_ID');
    let jackpotXProfit = req.body.jackpot;

    if( jackpotXProfit ) {
      let d = new Date();

      d.setSeconds( d.getSeconds() + 2 );

      let gameHistory = await GameHistory.findOne({game: ObjectId(gameId),'start': {$lte: d.toISOString()}, 'betting_allow_time': {$gt: d.toISOString()}},{number : 0}).exec(); 
      if(gameHistory) {
        gameHistory.jackpot = jackpotXProfit;
        gameHistory.save();   
        
        response.status = 1;
        response.message = 'Roulette Jackpot Has been Drawn.js';
  
      } else {
        response.message = 'Rollete Jackpot declare time has been over..js';
      }
    }

    res.status(response.status ? 200 : 500).json(response).end();
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({ response }).end();
  }

  
});

// Lucky card draw number
router.post('/lcdrawnumber',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawNumber');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Already updated"
  }

  const user = req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {

    let number = req.body.number;
    let jackpotXProfit = req.body.jackpot;

    if( number || jackpotXProfit ) {
      let settings = await settingsData();

      let d = new Date();
      d.setSeconds( d.getSeconds() + 2 );

      let gameHistory = await GameHistory.findOne({
        game: ObjectId(settings['Lucky_Card_GAME_ID']) , betting_allow_time: { $gte: d.toISOString() },
        end: { $gt: d.toISOString() },
        number : { $exists : false }
      }).exec();

      if( gameHistory ) {

        if(number) {
          response.status = 1;
          let update = await NumberSet.updateOne({'gameid': 'luckycard'}, {'number' : number});
          response.message = 'Number updated.js';
        }
        
        if( jackpotXProfit || jackpotXProfit == 0) {
          response.status = 1;
          gameHistory.jackpot = jackpotXProfit;
          gameHistory.save();

          response.message = 'JackPot Updated'
          if(number) {
            response.message = 'Number and JackPot updated.js';
          }
        }
      }
    }

    res.status(response.status ? 200 : 500).json(response).end();
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({ response }).end();
  }
});

// Dragon vs tiger draw number
router.post('/dtdrawnumber',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawNumber');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Already updated"
  }

  const user = req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {

    let number = req.body.number;
    let jackpotXProfit = req.body.jackpot;

    if( number || jackpotXProfit ) {
      let settings = await settingsData();

      let d = new Date();
      d.setSeconds( d.getSeconds() + 2 );

      let gameHistory = await GameHistory.findOne({
        game: ObjectId(settings['DRAGON_VS_TIGER_ID']) , betting_allow_time: { $gte: d.toISOString() },
        end: { $gt: d.toISOString() },
        number : { $exists : false }
      }).exec();

      if( gameHistory ) {

        if(number) {
          response.status = 1;
          let update = await NumberSet.updateOne({'gameid': 'dragonvstiger'}, {'number' : number});
          response.message = 'Number updated.js';
        }
        
        if( jackpotXProfit || jackpotXProfit == 0) {
          response.status = 1;
          gameHistory.jackpot = jackpotXProfit;
          gameHistory.save();

          response.message = 'JackPot Updated'
          if(number) {
            response.message = 'Number and JackPot updated.js';
          }
        }
      }
    }

    res.status(response.status ? 200 : 500).json(response).end();
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({ response }).end();
  }
});

// Draw number of triplechance
router.post('/triplechancedrawnumber',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawNumber');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Already updated"
  }

  const user = req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {

    let number = req.body.number;
    let jackpotXProfit = req.body.jackpot;

    if( number || jackpotXProfit ) {
      let settings = await settingsData();

      let d = new Date();
      d.setSeconds( d.getSeconds() + 2 );

      let gameHistory = await GameHistory.findOne({
        game: ObjectId(settings['TRIPLE_CHANCE_GAME_ID']) , betting_allow_time: { $gte: d.toISOString() },
        end: { $gt: d.toISOString() },
        number : { $exists : false }
      }).exec();

      if( gameHistory ) {

        if(number) {
          response.status = 1;
          let update = await NumberSet.updateOne({'gameid': 'triplechance'}, {'number' : number});
          response.message = 'Number updated.js';
        }
        
        if( jackpotXProfit || jackpotXProfit == 0) {
          response.status = 1;
          gameHistory.jackpot = jackpotXProfit;
          gameHistory.save();

          response.message = 'JackPot Updated'
          if(number) {
            response.message = 'Number and JackPot updated.js';
          }
        }
      }
    }

    res.status(response.status ? 200 : 500).json(response).end();
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({ response }).end();
  }
});

// Spin to win
router.post('/spintowindrawnumber',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawNumber');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Already updated"
  }

  const user = req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {

    let number = req.body.number;
    let jackpotXProfit = req.body.jackpot;

    if( number || jackpotXProfit ) {
      let settings = await settingsData();

      let d = new Date();
      d.setSeconds( d.getSeconds() + 2 );

      let gameHistory = await GameHistory.findOne({
        game: ObjectId(settings['SPIN_TO_WIN_GAME_ID']) , betting_allow_time: { $gte: d.toISOString() },
        end: { $gt: d.toISOString() },
        number : { $exists : false }
      }).exec();

      if( gameHistory ) {

        if(number) {
          response.status = 1;
          let update = await NumberSet.updateOne({'gameid': 'spintowin'}, {'number' : number});
          response.message = 'Number updated.js';
        }
        
        if(jackpotXProfit || jackpotXProfit == 0 ) {
          response.status = 1;
          gameHistory.jackpot = jackpotXProfit;
          gameHistory.save();

          response.message = 'JackPot Updated'
          if(number) {
            response.message = 'Number and JackPot updated.js';
          }
        }
      }
    }

    res.status(response.status ? 200 : 500).json(response).end();
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({ response }).end();
  }
});

// Lucky card draw number
router.post('/52cardsdrawnumber',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawNumber');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Already updated"
  }

  const user = req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {

    let number = req.body.number;
    let jackpotXProfit = req.body.jackpot;

    if( number || jackpotXProfit ) {
      let settings = await settingsData();

      let d = new Date();
      d.setSeconds( d.getSeconds() + 2 );

      let gameHistory = await GameHistory.findOne({
        game: ObjectId(settings['CARDSFIFTYTWO_GAME_ID']) , betting_allow_time: { $gte: d.toISOString() },
        end: { $gt: d.toISOString() },
        number : { $exists : false }
      }).exec();

      if( gameHistory ) {

        if(number) {
          response.status = 1;
          let update = await NumberSet.updateOne({'gameid': 'card52'}, {'number' : number});
          response.message = 'Number updated.js';
        }
        
        if(jackpotXProfit || jackpotXProfit == 0) {
          response.status = 1;
          gameHistory.jackpot = jackpotXProfit;
          gameHistory.save();

          response.message = 'JackPot Updated'
          if(number) {
            response.message = 'Number and JackPot updated.js';
          }
        }
      }
    }

    res.status(response.status ? 200 : 500).json(response).end();
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({ response }).end();
  }
});

// Roulette draw number
router.post('/lcdrawjackpot',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'drawJackpot');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  let response = {
    "status" : 0,
    "message" : "Issue in Lucky Card Drawjackpot request"
  }

  const user = req.user;
  
  if(user.role.id != 1) {
    response.message  = "Restricted area only for admin";
    return res.status(500).json(response);
  }
  
  try {
    let gameId = await settingsData('Lucky_Card_GAME_ID');
    let jackpotXProfit = req.body.jackpot;

    if( jackpotXProfit ) {
      let d = new Date();

      d.setSeconds( d.getSeconds() + 2 );

      let gameHistory = await GameHistory.findOne({game: ObjectId(gameId),'start': {$lte: d.toISOString()}, 'betting_allow_time': {$gt: d.toISOString()}},{number : 0}).exec(); 
      
      if(gameHistory) {
        gameHistory.jackpot = jackpotXProfit;
        gameHistory.save();

        response.status = 1;
        response.message = 'Lucky Card Jackpot Has been Drawn.js';
      } else {
        response.message = 'Lucky Card Jackpot declare time has been over..js';
      }
    }

    res.status(response.status ? 200 : 500).json(response).end();
  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    res.status(500).json({ response }).end();
  }

  
});

export default router;