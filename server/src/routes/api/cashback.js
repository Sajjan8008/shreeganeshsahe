import {
  response,
  Router
} from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
import { checkpermission, verifyToken, treeUnderUser  } from '../../helper/common.js';


const router = Router();

/**
 * Get the listing of Transactions  by user wise.
 */
// 
 router.post('/', requireJwtAuth, async (req, res) => {
  
  let response = {
    'status' : 0,
    'message' : 'Issue in cashback listing'
  };

 let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }
  
  let permission = await checkpermission(req.user.role.id,'cashback');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }


  try {

    
    let filters = {};
    let username = req.body.username !== undefined ? req.body.username : 0;
    let perPage = 20, page = parseInt(req.body?.currentPage ? req.body.currentPage : 0);

    filters.comment = 'cashback.js';
    filters.type = 'ADD.js';

    if(username) {

    let userObject =  await User.findOne({
       username: username
      }, 'id');

      if(userObject) {
        filters.toUser =  userObject.id;
      }
    }
    


    const transactions = await Transaction.find(filters,'trans_coins createdAt').limit(perPage).skip(page * perPage).sort({
        createdAt: -1
      }).populate('toUser','username').exec();

    response.status = 1;
    response.cashbacks = transactions; 
    response.message = '.js'; 
   return res.json(response);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    
    response.status = 0;
    response.message = err.message || err.toString();

    res.status(500).json(response);
  }
});

export default router;