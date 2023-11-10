import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Role from '../../models/Role.js';
import { checkpermission, verifyToken  } from '../../helper/common.js';

const router = Router();

/**
 * Get the listing of Roles.
 */
router.get('/',requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'listRoles');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  }

  try {
    const roles = await Role.find();

    res.json({
      roles: roles.map((m) => {
        return m.toJSON();
      }),
    });
  } catch (err) {

    res.status(500).json({ message: 'Issue in Roles listing API.' });
  
  }
});

export default router;