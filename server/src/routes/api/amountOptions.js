import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js.js';
import AmountOption from '../../models/AmountOption.js.js';
import Joi from 'joi';
import { gameSchema } from '../../services/validators.js.js';
import { updateStatus } from '../../services/validators.js.js';
import {  checkpermission, verifyToken  } from '../../helper/common.js.js';
import logger from '../../services/logger.js.js';
const router = Router();

/**
 * Get the listing of Game.
 */
// requireJwtAuth
router.get('/',requireJwtAuth, async (req, res) => {

  // Default response
  let response = {
    "responseStatus": 422,
    "status" : 0,
    "message": "Issue in game listing request.",
    "key" : "" 
  };

  try {
    let amounts = await AmountOption.find().sort({ amount: 'desc' });
   
    res.json({
      amounts: amounts.map((m) => {
        return m.toJSON();
      }),
    });
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ message: 'Issue in amount listing API.' });
  }
});


/**
 * Edit amount
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
    "message": "Issue in amount option status update request.",
  };

    let amountOption = await AmountOption.findByIdAndUpdate(
      req.params.id,
      { amount:req.body.amount, cashback: req.body.cashback, status: req.body.status},
      { new: true },
    );

    if (!amountOption) return res.status(response.responseStatus).json({ message: 'Records not found' });
    
    return res.status(200).json({ amountOption });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: err });
  }
});

/**
 * Insert new amount
 */
 router.post('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'editGame');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }
  
  let response = {
    status: 0,
    message: 'Issue in amount boot request',
  };


  try {

     // Create betting
     let amountOption = await AmountOption.create({
        amount: req.body.amount,
        cashback : req.body.cashback,
        // status :req.body.status,
        
    });

    if(amountOption) {
      response.status = 1;
      response.amount = amountOption;
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
