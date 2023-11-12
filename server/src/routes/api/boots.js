import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Boot from '../../models/Boot.js';
import Joi from 'joi';
import { updateStatus } from '../../services/validators.js';
import {  checkpermission, verifyToken  } from '../../helper/common.js';

const router = Router();


/**
 * Get the .
 */
router.get('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'listGame');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }
  
  // Default response
  let response = {
    "responseStatus": 422,
    "status" : 0,
    "message": "Issue in game listing request.",
    "key" : "" 
  };

  try {
    let boots = await Boot.find().sort({ createdAt: 'desc' }).exec();
   
    response.status = 1;
    response.boots = boots;
    response.message = '.js';

    return res.json(response);
    
  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: 'Issue in game listing API.' });
  }
});

/**
 * Get the specific game data
 */
router.get('/:id',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'listGame');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {
    const boot = await Boot.findById(req.params.id);
    if (!boot) return res.status(404).json({ message: 'No message found.' });
    res.json({ message: boot.toJSON() });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ message: 'Issue in single game type API.' });
  }
});

/**
 * Edit game status
 */
router.put('/:id',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'editGame');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }
  
  try {

    // Default response
  let response = {
    "status" : 0,
    "message": "Issue in game status update request.",
    "key" : "" 
  };

    let boot = await Boot.findByIdAndUpdate(
      req.params.id,
      { 
        maxPlayer: req.body.maxPlayer,
        bootValue : req.body.bootValue,
        minimum_entry :req.body.minimum_entry,
        chaalLimit : req.body.chaalLimit,
        potLimit: req.body.potLimit
      },
      { new: true },
    );

    if (!boot) return res.status(200).json({ message: 'Records not found' });
    
    return res.status(200).json({ boot });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: err });
  }
});

/**
 * Delete
 */
 router.delete('/:id',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'editGame');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }
  
  try {

    // Default response
  let response = {
    "status" : 0,
    "message": "Issue boot delete.",
    "key" : "" 
  };

    let boot = await Boot.deleteOne({_id: req.params.id});

    return res.status(200).json({ boot });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: err });
  }
});




/**
 * Get the specific game data
 */
 router.post('/',requireJwtAuth, async (req, res) => {

  let response = {
    status: 0,
    message: 'Issue in create boot request',
  };


  try {

     // Create betting
     let boot = await Boot.create({
        maxPlayer: req.body.maxPlayer,
        bootValue : req.body.bootValue,
        minimum_entry :req.body.minimum_entry,
        chaalLimit : req.body.chaalLimit,
        potLimit: req.body.potLimit
    });

    if(boot) {
      response.status = 1;
      response.boot = boot;
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
