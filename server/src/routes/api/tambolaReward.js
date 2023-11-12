import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import TambolaReward from '../../models/TambolaReward.js';
import Joi from 'joi';
import {  checkpermission, verifyToken  } from '../../helper/common.js';
import mongoose from 'mongoose';
  const  ObjectId  = mongoose.Schema.Types.ObjectId;

const router = Router();

/**
 * Get the listing of Game.
 */
// requireJwtAuth
router.get('/', async (req, res) => {

  // Default response
  let response = {
    "status" : 0,
    "message": "Issue in game listing request." 
  };

  try {
    let tambolaRewards = await TambolaReward.find();
   
    response.message = "Tambola rewards list";
    response.status = 1;
    response.tambolaRewards = tambolaRewards;

   return res.json(response);
   
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ message: 'Issue in amount listing API.' });
  }
});


/**
 * Edit amount
 */
// requireJwtAuth
router.put('/:id', async (req, res) => {

  // let authstatus = await verifyToken(req);
  // if(authstatus.status == 0) {
  //   return res.status(403).json(authstatus);
  // }

  // let permission = await checkpermission(req.user.role.id,'editGame');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }
  
  try {

     // Default response
  let response = {
    "status" : 0,
    "message": "Issue in update rewards.",
  };

  let tambolaReward = await TambolaReward.findById(req.params.id);

  if(req.body.name) {
    tambolaReward.name = req.body.name; 
  }

  if(req.body.count) {
    tambolaReward.count = req.body.count; 
  }

  if(req.body.status) {
    tambolaReward.status = req.body.status; 
  }

  await tambolaReward.save();
  
  response.status =1;
  response.message = 'Updated records.js';

  return res.json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: err });
  }
});
// requireJwtAuth
/**
 * Insert new amount
 */
// requireJwtAuth
 router.post('/', async (req, res) => {

  // let authstatus = await verifyToken(req);
  // if(authstatus.status == 0) {
  //   return res.status(403).json(authstatus);
  // }

  // let permission = await checkpermission(req.user.role.id,'editGame');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }
  
  let response = {
    status: 0,
    message: 'Issue in creating tambola game'
  };


  try {

    let name = req.body.name;
    let count = req.body.count;
    let status = req.body.status;
    

    // GameHistory     
   let tambolaRewards =  await TambolaReward.create({
      name : name,
      count: count,
      status : status
  });

  
    if(tambolaRewards) {
      response.status = 1;
      response.tambolaRewards = tambolaRewards;
      response.message = '.js'; 
    }

    return res.status(response.status == 1 ? 200 : 500 ).json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message;
    res.status(500).json(response);
  }
});

export default router;
