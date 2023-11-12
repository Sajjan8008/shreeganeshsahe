import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Game from '../../models/Game.js';
import Joi from 'joi';
import { gameSchema } from '../../services/validators.js';
import { updateStatus } from '../../services/validators.js';
import {  checkpermission, verifyToken  } from '../../helper/common.js';
import mongoose from 'mongoose';
const  ObjectId  = mongoose.Schema.Types.ObjectId;
const router = Router();

/**
 * Get the listing of Game.
 */

// 
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
    let games = await Game.find().sort({ createdAt: 'desc' });
   
    
    if( req.user.role.id == 3 ) {
      let newgames = [];
      for( let singleGame of games ) {
        if( !req.user.games.includes(singleGame.id) && singleGame.status  ) {
          singleGame.status =  false;
        }
        newgames.push(singleGame);
      }
      games = newgames;
    }

    res.json({
      games: games.map((m) => {
        return m.toJSON();
      }),
    });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ message: err.message });
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
    const game = await Game.findById(req.params.id);
    if (!gameType) return res.status(404).json({ message: 'No message found.' });
    res.json({ message: gameType.toJSON() });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ message: 'Issue in single game type API.' });
  }
});

/**
 * Edit game status
 */
// requireJwtAuth
router.put('/update/:id', requireJwtAuth, async (req, res) => {

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
    "responseStatus": 404,
    "status" : 0,
    "message": "Issue in game status update request.",
    "key" : "" 
  };

    let game = await Game.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, minimumamount: parseInt(req.body.minimumamount)},
      { new: true },
    );

    if (!game) return res.status(response.responseStatus).json({ message: 'Records not found' });
    
    return res.status(200).json({ game });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: err });
  }
});

export default router;
