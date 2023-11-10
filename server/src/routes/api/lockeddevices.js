import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import LockedDevices from '../../models/LockedDevices.js';
import {  checkpermission, verifyToken  } from '../../helper/common.js';
const ObjectId = require('mongoose').Types.ObjectId;
let logger = require('../../services/logger');
const router = Router();

/**
 * Get the listing of Game.
 */

// 
router.post('/', requireJwtAuth , async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'listlockeddevices');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }
  
  // Default response
  let response = {
    "status" : 0,
    "message": "Issue in locked devices listing request.",
  };

  try {

      
    let perPage = 20, page = 0;

    if( req.body.currentPage ) {
      page = parseInt(req.body.currentPage)
    }

    
   let lockedDevices = await LockedDevices.find().limit(perPage).skip(page * perPage).sort({ createdAt: -1 });
   
   response.lockedDevices = [];
   response.status = 1;
   response.message = '.js';
   
    if(lockedDevices.length) {
      response.lockedDevices = lockedDevices;
    }

   return res.status(response.status == 1 ? 200 : 500).json(response);
    
  } catch (err) {
    logger.error((err.message || err.toString()), {metadata: err});
    res.status(500).json({ message: err.message });
  }
});


/**
 * Delete device
 */

 
router.delete('/:id',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'deletedevices');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }
  
  
  try {

   // Default response
  let response = {
    "status" : 0,
    "message": "Issue in delete device." 
  };

    let deleteDevice = await LockedDevices.deleteOne({_id: ObjectId(req.params.id)});

    if(deleteDevice.deletedCount) {
      response.status = 1;
      response.message = 'Deleted device id.js';
    }
    
    return res.status(response.status == 1 ? 200 : 500).json({ response });

  } catch (err) {
    logger.error((err.message || err.toString()), {metadata: err});
    return res.status(500).json({ message: err.message });
  }
});

export default router;
