import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';

const router = Router();

/**
 * Edit game status
 */
router.post('/', async (req, res) => {

  
  try {
 
     // Default response
  let response = {
    "status" : 1,
    "message": "Logs your error. thank you.",
    
  };

  let user = 'unity-'+ req.body.user;
  let object = req.body.err;

  logger.error(user, {metadata: object});

    return res.status(200).json({ response });

  } catch (err) {
    logger.error(err.message, {metadata: err});
    return res.status(500).json({ message: err });
  }
});

export default router;
