import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import BettingType from '../../models/BettingType.js';
import Joi from 'joi';
import { addBettingType, updateBettingType } from '../../services/validators.js';
import { settingsData, bettingAlowedGame, crGame, verifyToken, checkpermission  } from '../../helper/common.js';
import Setting from '../../models/Setting.js';
import mongoose from 'mongoose';
const  ObjectId  = mongoose.Schema.Types.ObjectId;

import 'dotenv';

const router = Router();

const env = process.env;
/**
 * Get the listing of bettingType.
 */
 //
router.post('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

    let permission = await checkpermission(req.user.role.id,'getTypes');
    if( permission.status == 0 ) {
      return res.status(403).json(permission);
    }


  try {
    
    let gameId = req.body.game;
    

    req.user.current_game = ObjectId(gameId);
    await req.user.save();

    let response = {};

    response['bettingTypes'] = await BettingType.find({'game': ObjectId(gameId)}).sort({ winning_x: 'desc' });

    
    if(req.body.settings != undefined && req.body.settings == 1) {
      let maximumBets = await Setting.findOne({name:'maximum_betting_amount'},{_id:0,value:1});
      
      let settings = {
        'maximum_betting_amount' : maximumBets.value
      };

      if( gameId == env.ROLLETE_GAME_ID ) {

        settings['ROLLETE_GAME_TIME'] = env.ROLLETE_GAME_TIME;
        settings['GAME_GAP'] = env.GAME_GAP;
        settings['BETTING_INTERVAL_TIME'] = env.BETTING_INTERVAL_TIME;
        
        settings['UNITY_ORANGE_COLOR'] = env.UNITY_ORANGE_COLOR;
        settings['UNITY_RED_COLOR'] = env.UNITY_RED_COLOR;
        settings['UNITY_STOP_BET'] = env.UNITY_STOP_BET;
        settings['UNITY_GREEN_COLOR'] = env.UNITY_GREEN_COLOR;

      } else if(gameId == env.Lucky_Card_GAME_ID){

        settings['LuckyCard_Total_Game_Time'] = env.LuckyCard_Total_Game_Time;
        settings['LuckyCard_Timer_Time'] = env.LuckyCard_Timer_Time;
        settings['LuckyCard_Wait_Time'] = env.LuckyCard_Wait_Time;
        settings['LuckyCard_Stop_Bet'] = env.LuckyCard_Stop_Bet;

      } else if(gameId == env.CARDSFIFTYTWO_GAME_ID){
        
        settings['CARDSFIFTYTWO_Total_Game_Time'] = env.CARDSFIFTYTWO_Total_Game_Time;
        settings['CARDSFIFTYTWO_Timer_Time'] = env.CARDSFIFTYTWO_Timer_Time;
        settings['CARDSFIFTYTWO_Wait_Time'] = env.CARDSFIFTYTWO_Wait_Time;
        settings['CARDSFIFTYTWO_Stop_Bet'] = env.CARDSFIFTYTWO_Stop_Bet;
        

      }else if(gameId == env.TRIPLE_CHANCE_GAME_ID){
        
        settings['TRIPLE_CHANCE_Total_Game_Time'] = env.TRIPLE_CHANCE_Total_Game_Time;
        settings['TRIPLE_CHANCE_Timer_Time'] = env.TRIPLE_CHANCE_Timer_Time;
        settings['TRIPLE_CHANCE_Wait_Time'] = env.TRIPLE_CHANCE_Wait_Time;
        settings['TRIPLE_CHANCE_Stop_Bet'] = env.TRIPLE_CHANCE_Stop_Bet;
        settings['TRIPLE_CHANCE_GAME_PRINT'] = env.TRIPLE_CHANCE_GAME_PRINT;


      } else if(gameId == env.SPIN_TO_WIN_GAME_ID) {
        
        settings['SPIN_TO_WIN_Total_Game_Time'] = env.SPIN_TO_WIN_Total_Game_Time;
        settings['SPIN_TO_WIN_Timer_Time'] = env.SPIN_TO_WIN_Timer_Time;
        settings['SPIN_TO_WIN_Wait_Time'] = env.SPIN_TO_WIN_Wait_Time;
        settings['SPIN_TO_WIN_Stop_Bet'] = env.SPIN_TO_WIN_Stop_Bet;
        settings['SPIN_TO_WIN_GAME_ID_PRINT'] = env.SPIN_TO_WIN_GAME_ID_PRINT;

      } else if(gameId == env.DRAGON_VS_TIGER_ID) {

        settings['DRAGON_VS_TIGER_Total_Game_Time'] = env.DRAGON_VS_TIGER_Total_Game_Time;
        settings['DRAGON_VS_TIGER_Timer_Time'] = env.DRAGON_VS_TIGER_Timer_Time;
        settings['DRAGON_VS_TIGER_Wait_Time'] = env.DRAGON_VS_TIGER_Wait_Time;
        settings['DRAGON_VS_TIGER_Stop_Bet'] = env.DRAGON_VS_TIGER_Stop_Bet;
        settings['DRAGON_VS_TIGER_betting_stop'] = env.DRAGON_VS_TIGER_betting_stop;
        settings['DRAGON_VS_TIGER_game_gap'] = env.DRAGON_VS_TIGER_game_gap;
        settings['DRAGON_VS_TIGER_ID_PRINT'] = env.DRAGON_VS_TIGER_ID_PRINT;
      }

      response['settings'] = settings;
    }
    

    res.json(response);
    
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ message: 'Issue in betting type listing API.' });
  }
});


/**
 * Edit bettingType
 */
router.put('/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'editTypes');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "responseStatus": 422,
    "status" : 0,
    "message": "Issue in betting type request",
    "key" : "" 
  };
  
  // Check validation for add betting type
  const { error } = Joi.validate(req.body, updateBettingType );
    if (error) {
      return res.status(response.responseStatus).send({ message: error.details[0].message });
    }
    
  
  try {
    
    let bettingType = await BettingType.findByIdAndUpdate(
      req.params.id,
      {$set: req.body},
      { new: true }
    );
    if (!bettingType) return res.status(404).json({ message: 'Records not found' });
    
    res.status(200).json({ bettingType });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ message: 'Issue in update bettingType request.' });
  }
});

export default router;