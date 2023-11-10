import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import DailyRewards from '../../models/DailyRewards.js';
import { checkpermission, verifyToken  } from '../../helper/common.js';
import Feedback from '../../models/FeedBack.js';
const ObjectId = require('mongoose').Types.ObjectId;
let logger = require('../../services/logger');

const router = Router();

/**
 * Get the listing of feedbacks.
 */
router.get('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let response = {
    'status' : 0,
    'message': 'Issue in the list of feedbacks.'
  }

  try {
    const allFeedbacks = await Feedback.find().populate({
      path: 'user',
      model: 'User',
      select: 'id, username',
    }).sort({createdAt: -1}).exec();

    if(allFeedbacks.length ) {
      response.status = 1;
      response.message = '.js';
      response.data = allFeedbacks;
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

  let response = {
    'status' : 0,
    'message': 'Issue in insert daily rewards.'
  }

  try {


    let message = req.body.message;
    let userid = req.user.id;

    const feedback = await Feedback.create({
      message : message,
      user: ObjectId( userid ) 
    });

    if( feedback ) {
      response.status = 1;
      response.message = '.js';
      response.data = feedback;
    }
    
    return res.status(response.status == 1 ? 200 : 500).json(response);
    
  } catch (err) {
    res.status(500).json({ status : 0, message: err.message || err.toString()  });
  }
});

/**
 * Get the listing of day and rewards.
 */
 router.post('/:id',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let response = {
    'status' : 0,
    'message': 'Issue in insert daily rewards.'
  }

  try {

    let status = req.body.status;

    if(typeof status != "boolean") {
        response.message = 'Only boolean value accepted.js';
        return res.status(500).json(response);
    }

    let feedbackUpdate = await Feedback.findById(req.params.id).exec();
    
    if( feedbackUpdate ) {

      feedbackUpdate.status = status;
      await feedbackUpdate.save();

      response.status = 1;
      response.message = 'Updated day and rewards.js';
      response.data = feedbackUpdate; 
    }

    
    return res.status(response.status == 1 ? 200 : 500).json(response);
    
  } catch (err) {

    logger.error(err.message, {metadata: err});
    res.status(500).json({ status : 0, message: err.message || err.toString()  });
  
  }
});

export default router;