import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Token from '../../models/Token.js';

import { checkpermission, verifyToken } from '../../helper/common.js';
let logger = require('../../services/logger');
const router = Router();

/**
 * get tokens 
 */
router.get('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }
  
  let permission = await checkpermission(req.user.role.id,'listToken');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {

    let filters = {};

    if(req.user.role.id == 3) {

      filters.status = true;
      filters.notAllowedGames = { $ne : req.user.current_game };

    }
    const token = await Token.find(filters).sort({ coins: 'asc' });

    res.json({
      token: token.map((m) => {
        return m.toJSON();
      }),
    });
  } catch (err) {
    res.status(500).json({ message: 'Issue in token listing API.' });
  }
});

/**
 * get token by id
 */
router.get('/:id',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'editTypes');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {
    const token = await Token.findById(req.params.id);
    if (!token) return res.status(404).json({ message: 'No record found' });
    res.json({ message: token.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Issue in single token API.' });
  }
});

/**
 * Edit token status
 */
router.put('/update',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'editToken');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {

    let status = req.body.status;
    let id = req.body.id;
    
    let token = await Token.findByIdAndUpdate(
      id,
      {$set: {"status" : status} },
      { new: true }
    );
    if (!token) return res.status(404).json({ message: 'Records not found' });
    
    res.status(200).json({ token });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({ error: err.message || err.toString() });
  }
});

export default router;
