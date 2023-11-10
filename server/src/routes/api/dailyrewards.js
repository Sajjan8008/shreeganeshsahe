import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import DailyRewards from '../../models/DailyRewards.js';
import { checkpermission, verifyToken  } from '../../helper/common.js';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
const ObjectId = require('mongoose').Types.ObjectId;

const router = Router();

/**
 * Get the listing of day and rewards.
 */
router.get('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id,'listRoles');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    'status' : 0,
    'message': 'Issue in get the list of rewards.'
  }

  try {
    const dailyRewards = await DailyRewards.find().exec();

    if(dailyRewards.length) {
      response.status = 1;
      response.message = '.js';
      response.data = dailyRewards;
    }
    
    return res.status(response.status == 1 ? 200 : 500).json(response);
    
  } catch (err) {

    res.status(500).json({ status : 0, message: err.message || err.toString()  });
  
  }
});

/**
 * Get the listing of day and rewards.
 */
 router.post('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id,'listRoles');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    'status' : 0,
    'message': 'Issue in insert daily rewards.'
  }

  try {


    let day = req.body.day;
    let rewards = req.body.points;

    const dailyRewards = await DailyRewards.create({
      day : day,
      rewards: rewards 
    });

    if( dailyRewards ) {
      response.status = 1;
      response.message = '.js';
      response.data = dailyRewards;
    }
    
    return res.status(response.status == 1 ? 200 : 500).json(response);
    
  } catch (err) {

    res.status(500).json({ status : 0, message: err.message || err.toString()  });
  
  }
});

/**
 * Get the listing of day and rewards.
 */
 router.post('/:day',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id,'listRoles');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    'status' : 0,
    'message': 'Issue in insert daily rewards.'
  }

  try {


    let day = parseInt(req.params.day);
    let rewards = req.body.points;

    if(rewards <= 0) {
      response.message = 'Points can not 0 or less.js';
      return res.status(500).json(response);
    }

    let dailyRewards = await DailyRewards.findOne({'day' : day}).exec();
    
    if( dailyRewards ) {

      dailyRewards.rewards = rewards;
      await dailyRewards.save();

      response.status = 1;
      response.message = 'Updated day and rewards.js';
      response.data = dailyRewards; 
    }

    
    return res.status(response.status == 1 ? 200 : 500).json(response);
    
  } catch (err) {

    res.status(500).json({ status : 0, message: err.message || err.toString()  });
  
  }
});

/**
 * Get the listing of day and rewards.
 */
 router.get('/claimrewards/:day',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  //req.user = await User.findById('61c5aa15ae9994283e65661c').exec();

  // let permission = await checkpermission(req.user.role.id,'listRoles');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    'status' : 0,
    'message': 'Issue in insert daily rewards.'
  }

  try {


    let day = parseInt(req.params.day);

    
    let dailyRewards = await DailyRewards.findOne({'day' : day}).exec();
    
    if( dailyRewards ) {
      
      req.user.coins += dailyRewards.rewards;
      let currentDateTime = new Date();

      req.user.daily_rewards_claim = currentDateTime.toISOString();
      req.user.daily_rewards_day = day; 

    
      await req.user.save();

      
      // Admin id
      let trans_coins = dailyRewards.rewards; 
      let comment = 'Daily rewards day ' + day;
      let toUser = req.user.id;
      // Get admin details
      let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

      fromUser.coins = fromUser.coins - trans_coins;  
      await fromUser.save();

      await Transaction.create({
        type: "SUBTRACT",
        toUser: ObjectId(fromUser.id),
        fromUser: ObjectId(toUser),
        trans_coins: trans_coins,
        comment: comment,
        remaining_coins: fromUser.coins
    });

    await Transaction.create({
      type: "ADD",
      toUser: ObjectId(toUser),
      fromUser: ObjectId(fromUser.id),
      trans_coins: trans_coins,
      comment: comment,
      remaining_coins: req.user.coins
  });

      response.status = 1;
      response.message = 'Updated day and rewards.js';
      response.data = dailyRewards; 
    }

    
    return res.status(response.status == 1 ? 200 : 500).json(response);
    
  } catch (err) {

    res.status(500).json({ status : 0, message: err.message || err.toString()  });
  
  }
});

export default router;