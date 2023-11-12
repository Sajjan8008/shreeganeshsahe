import {
  Router
} from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Setting from '../../models/Setting.js';
import Payment from '../../models/Payment.js';
import 'dotenv';
//import Promise from 'promise.js';  
import {
  verifyToken,
  checkpermission,
  settingsData
} from '../../helper/common.js';
const router = Router();
import mongoose from 'mongoose';
  const  ObjectId  = mongoose.Schema.Types.ObjectId;

const env = process.env;

router.get('/version', async (req, res) => {
  try {

    const settings = await Setting.find({
      name: {
        $in: ['android_app_version', 'window_app_version', 'printwindow_app_version']
      }
    }, 'name value').sort({
      createdAt: 'desc'
    }).exec();
    let allSettings = {};

    settings.forEach(function (element) {
      allSettings[element.name] = element.value;
    });
//await new Promise(resolve => setTimeout(resolve, 3000));   
 return res.status(200).json(allSettings);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in version API.'
    });
  }
});
// popup api
router.get('/popup', async (req, res) => {
  try {

    const settings = await Setting.find({
      name: {
        $in: ['signup_info_popup','maintence_popup', 'welcomecoins_popup', 'update_popup','emergency_update_url', 'agreementurl', 'playstorelink']
      }
    }, 'name value').sort({
      createdAt: 'desc'
    }).exec();
    let allSettings = {};

    settings.forEach(function (element) {
      allSettings[element.name] = element.value;
    });
//await new Promise(resolve => setTimeout(resolve, 3000));   
 return res.status(200).json(allSettings);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in version API.'
    });
  }
});

// requireJwtAuth
router.get('/runningtext',requireJwtAuth, async (req, res) => {

    let authstatus = await verifyToken(req);
    if (authstatus.status == 0) {
      return res.status(403).json(authstatus);
    }
  
    let response = {
      status: 0,
      message: 'Issue in running text.'
    }
  
    try {
      
      let runningText = await settingsData('runningtext');
  
      runningText = runningText.trim();
  
      if( !runningText ) {
        let payments = await Payment.find({txn_status:2},'type amount').limit(15).sort({
          _id: 'desc'
        }).populate('userid', 'name').exec();
    
  
        if(payments.length) {
          runningText = '.js';
          for (const singlePayment of payments) {
            if(singlePayment.userid) {
              runningText += `${singlePayment.userid.name} ${singlePayment.type} ${singlePayment.amount}, `;
            }
            
          }
  
          if(runningText) {
            runningText = runningText.trim();
            runningText = runningText.substr(0,runningText.length-1);
          }
        }
      }
  
      response.status = 1;
      response.message = 'Got running'
      response.runningText = runningText; 
          
      return res.status(200).json(response);
  
    } catch (err) {
      logger.error(err.message, {metadata: err});
      return res.status(500).json({
        error: err.message || err.toString()
      });
    }
  });
//Setting with env
router.get('/settingwithenv', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'getSettings');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {
    const settings = await Setting.find({}, 'name value').sort({
      createdAt: 'desc'
    }).exec();

    let allSettings = {};

    settings.forEach(function (element) {
      allSettings[element.name] = element.value;
    });

    allSettings.ROLLETE_GAME_TIME = env.ROLLETE_GAME_TIME;
    allSettings.GAME_GAP = env.GAME_GAP;
    allSettings.BETTING_INTERVAL_TIME = env.BETTING_INTERVAL_TIME;

    allSettings.UNITY_TOTAL_GAME_TIME = env.ROLLETE_GAME_TIME;
    allSettings.UNITY_TIMER_TIME = env.BETTING_INTERVAL_TIME;
    allSettings.UNITY_ORANGE_COLOR = env.UNITY_ORANGE_COLOR;
    allSettings.UNITY_RED_COLOR = env.UNITY_RED_COLOR;
    allSettings.UNITY_STOP_BET = env.UNITY_STOP_BET;
    allSettings.UNITY_WAIT_TIME = env.GAME_GAP;
    allSettings.UNITY_GREEN_COLOR = env.UNITY_GREEN_COLOR;

    allSettings.Lucky_Card_GAME_ID = env.Lucky_Card_GAME_ID;
    allSettings.LuckyCard_Total_Game_Time = env.LuckyCard_Total_Game_Time;
    allSettings.LuckyCard_Timer_Time = env.LuckyCard_Timer_Time;
    allSettings.LuckyCard_Wait_Time = env.LuckyCard_Wait_Time;
    allSettings.LuckyCard_Stop_Bet = env.LuckyCard_Stop_Bet;

    allSettings.JH_GAME_ID = env.JH_GAME_ID;
    allSettings.JH_TOTAL_GAME_TIME = env.JH_TOTAL_GAME_TIME;
    allSettings.JH_TIMER_TIME = env.JH_TIMER_TIME;
    allSettings.JH_WAIT_TIME = env.JH_WAIT_TIME;

    allSettings.CARDSFIFTYTWO_GAME_ID = env.CARDSFIFTYTWO_GAME_ID;
    allSettings.CARDSFIFTYTWO_Total_Game_Time = env.CARDSFIFTYTWO_Total_Game_Time;
    allSettings.CARDSFIFTYTWO_Timer_Time = env.CARDSFIFTYTWO_Timer_Time;
    allSettings.CARDSFIFTYTWO_Wait_Time = env.CARDSFIFTYTWO_Wait_Time;
    allSettings.CARDSFIFTYTWO_Stop_Bet = env.CARDSFIFTYTWO_Stop_Bet;

    allSettings.TRIPLE_CHANCE_GAME_ID = env.TRIPLE_CHANCE_GAME_ID;
    allSettings.TRIPLE_CHANCE_Total_Game_Time = env.TRIPLE_CHANCE_Total_Game_Time;
    allSettings.TRIPLE_CHANCE_Timer_Time = env.TRIPLE_CHANCE_Timer_Time;
    allSettings.TRIPLE_CHANCE_Wait_Time = env.TRIPLE_CHANCE_Wait_Time;
    allSettings.TRIPLE_CHANCE_Stop_Bet = env.TRIPLE_CHANCE_Stop_Bet;

    allSettings.SPIN_TO_WIN_GAME_ID = env.SPIN_TO_WIN_GAME_ID;
    allSettings.SPIN_TO_WIN_Total_Game_Time = env.SPIN_TO_WIN_Total_Game_Time;
    allSettings.SPIN_TO_WIN_Timer_Time = env.SPIN_TO_WIN_Timer_Time;
    allSettings.SPIN_TO_WIN_Wait_Time = env.SPIN_TO_WIN_Wait_Time;
    allSettings.SPIN_TO_WIN_Stop_Bet = env.SPIN_TO_WIN_Stop_Bet;

    allSettings.DRAGON_VS_TIGER_ID = env.DRAGON_VS_TIGER_ID;
    allSettings.DRAGON_VS_TIGER_Total_Game_Time = env.DRAGON_VS_TIGER_Total_Game_Time;
    allSettings.DRAGON_VS_TIGER_Timer_Time = env.DRAGON_VS_TIGER_Timer_Time;
    allSettings.DRAGON_VS_TIGER_Wait_Time = env.DRAGON_VS_TIGER_Wait_Time;
    allSettings.DRAGON_VS_TIGER_Stop_Bet = env.DRAGON_VS_TIGER_Stop_Bet;
    allSettings.DRAGON_VS_TIGER_betting_stop = env.DRAGON_VS_TIGER_betting_stop;
    allSettings.DRAGON_VS_TIGER_game_gap = env.DRAGON_VS_TIGER_game_gap;

    
    return res.status(200).json(allSettings);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

/**
 * Get the listing of Settings.
 */
//requireJwtAuth
 router.get('/:selectgame',requireJwtAuth , async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'getSettings');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {

    let filters = {};
    let game = req.params.selectgame;
    game = game.trim();
    
    if(game == 'payment') {

      filters.filter = 'payment.js';

    } else if(game == 'general') {

      filters.game = { "$exists" : false };

    } else if(game != 'all'){
      
      filters.game = ObjectId(game);
  }


    
    const settings = await Setting.find(filters).sort({
      orderby: 'asc'
    });

    res.json({
      settings: settings.map((m) => {
        return m.toJSON();
      }),
    });
  } catch (err) {

    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in settings API.'
    });
  }
});


/**
 * Edit Setting
 */
router.put('/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'editSettings');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  try {

    const user = await req.user.getUserWithRole(req.user);

    if (user.role.id != 1) {
      return res.status(500).json({
        "status": 0,
        "message": "Restricted area only for admin"
      });
    }

    let setting = await Setting.findByIdAndUpdate(
      req.params.id, {
        value: req.body.value
      }, {
        new: true
      }
    );
    if (!setting) return res.status(404).json({
      message: 'Records not found'
    });

    res.status(200).json({
      setting
    });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      message: 'Issue in update setting request.'
    });
  }
});



export default router;
