import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import User from '../../models/User.js';
import Joi from 'joi';
import 'dotenv';
import { updateStatus } from '../../services/validators.js';
import {  checkpermission, verifyToken, getDisplayId,getAllGames  } from '../../helper/common.js';

import { getIndianMaleName, getIndianFemaleName }  from 'random-in';
import mongoose from 'mongoose';
  const  ObjectId  = mongoose.Schema.Types.ObjectId;

const router = Router();
const env = process.env;
/**
 * Get the .
 */
//requireJwtAuth
router.get('/',requireJwtAuth, async (req, res) => {

  // let authstatus = await verifyToken(req);
  // if(authstatus.status == 0) {
  //   return res.status(403).json(authstatus);
  // }

  // let permission = await checkpermission(req.user.role.id,'boatlist');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }
  
  // Default response
  let response = {
    "status" : 0,
    "message": "Issue in game listing request.",
    "key" : "" 
  };

  try {
    let boats = await User.find({boat:true}).sort({ createdAt: 'desc' }).limit(50).exec();
   
    response.status = 1;
    response.boats = boats;
    response.message = '.js';

    return res.json(response);
    
  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: 'Issue in game listing API.' });
  }
});


/**
 * 
 */
//requireJwtAuth
 router.post('/',requireJwtAuth, async (req, res) => {

  let response = {
    status: 0,
    message: 'Issue in create boot request',
  };

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'addboat');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {

  let mansImages = [0,1,2,4,6,7,9,11,12,14];
  let woomanImages = [3,5,8,10,13];
  
  const min = 10000;
  const max = 20000;
  

  let totalBoats = parseInt(req.body.noofboat);

  let womanBoat = parseInt(totalBoats * 0.30);

  let manBoat = totalBoats - womanBoat;

  let displayId = 0;
  let coins = 0;

  for(let man = 0 ; man < manBoat ; man++ ) {

    displayId = await getDisplayId();

    coins = Math.floor(Math.random() * (max - min + 1)) + min;

    await User.create({
      provider: 'username',
      device_id: '',
      commission: 0,
      role: ObjectId( env.DEFAULT_ROLE_APP_SIGNUP ),
      parent: ObjectId( env.DEFAULT_AGENT_APP_SIGNUP ),
      coins: coins,
      lockedmoney : coins,
      displayid:displayId,
      username:'P' + displayId,
      name:getIndianMaleName(),
      image: mansImages[Math.floor(Math.random() * mansImages.length)], 
      status: true,
      boat: true,
      token:'',
      refer_code: '',
      games: await getAllGames(),
    });
   
  }

  for(let woman = 0 ; woman < womanBoat ; woman++ ) {
    
    displayId = await getDisplayId();

    coins = Math.floor(Math.random() * (max - min + 1)) + min;

    await User.create({
      provider: 'username',
      device_id: '',
      commission: 0,
      role: ObjectId( env.DEFAULT_ROLE_APP_SIGNUP ),
      parent: ObjectId( env.DEFAULT_AGENT_APP_SIGNUP ),
      coins: coins,
      lockedmoney : coins,
      displayid:displayId,
      username:'P' + displayId,
      name:getIndianFemaleName(),
      image: woomanImages[Math.floor(Math.random() * woomanImages.length)], 
      status: true,
      boat: true,
      token:'',
      refer_code: '',
      games: await getAllGames(),
    });
  }

  response.status = 1;
  response.message = 'Boats created total '. totalBoats;
  response.woman = womanBoat;
  response.man = manBoat;

  return res.json(response);
 
} catch (err) {
  logger.error(err.message, {metadata: err});
  response.message = err.message;
  return res.status(500).json(response);
}
});

/**
 * Delete
 */
 router.delete('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'addboat');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }
      
  // Default response
      let response = {
        "status" : 0,
        "message": "Issue boats deleted.",
        "key" : "" 
      };
  
  try {

    let boatsDeleted = await User.deleteMany({boat: true});

    response.status = 1;
    response.message = "Boats has been deleted";
    response.boatsDeleted  = boatsDeleted;
    return res.status(200).json({ response });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: err });
  }
});




export default router;
