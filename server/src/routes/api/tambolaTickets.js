import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import TambolaTicket from '../../models/TambolaTickets.js';
import {parse} from 'csv-parse';
import fs from 'fs';
import Joi from 'joi';
import 'dotenv';
import { updateStatus } from '../../services/validators.js';
import {  checkpermission, verifyToken, getDisplayId,getAllGames  } from '../../helper/common.js';
import { getIndianMaleName, getIndianFemaleName }  from 'random-in';
import mongoose from 'mongoose';
  const  ObjectId  = mongoose.Schema.Types.ObjectId;

const router = Router();
const env = process.env;

/**
 * 
 */
//requireJwtAuth
 router.get('/', async (req, res) => {

  let response = {
    status: 0,
    message: 'Issue in create tickets',
  };

 /* let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id,'addboat');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  } */

  try {

    let dataTickets = {};

    // tambolatk.csv
    //'../../models/TambolaTickets'
    await fs.createReadStream('public/uploads/tambolatk.csv')
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {

      let numb = row[0].match(/\d/g);
      numb = numb.join("");
      let rowNumber = parseInt(numb);
      dataTickets[rowNumber] = {
        ticketid: rowNumber,
        C1: row[1] ? row[1] : 0,
        C2: row[2] ? row[2] : 0,
        C3: row[3] ? row[3] : 0,
        C4: row[4] ? row[4] : 0,
        C5: row[5] ? row[5] : 0,
        C6: row[6] ? row[6] : 0,
        C7: row[7] ? row[7] : 0,
        C8: row[8] ? row[8] : 0,
        C9: row[9] ? row[9] : 0,
        C10: row[10] ? row[10] : 0,
        C11: row[11] ? row[11] : 0,
        C12: row[12] ? row[12] : 0,
        C13: row[13] ? row[13] : 0,
        C14: row[14] ? row[14] : 0,
        C15: row[15] ? row[15] : 0,
        C16: row[16] ? row[16] : 0,
        C17: row[17] ? row[17] : 0,
        C18: row[18] ? row[18] : 0,
        C19: row[19] ? row[19] : 0,
        C20: row[20] ? row[20] : 0,
        C21: row[21] ? row[21] : 0,
        C22: row[22] ? row[22] : 0,
        C23: row[23] ? row[23] : 0,
        C24: row[24] ? row[24] : 0,
        C25: row[25] ? row[25] : 0,
        C26: row[26] ? row[26] : 0,
        C27: row[27] ? row[27] : 0
      };

    })
    .on("end", function () {
      console.log("finished");
      TambolaTicket.insertMany(Object.values(dataTickets));
    })
    .on("error", function (error) {
      console.log(error.message);
    });

  response.status = 1;
  response.message = 'Tambola ticket inserted '. dataTickets.length;
    

  return res.json(response);
 
} catch (err) {
  logger.error(err.message, {metadata: err});
  response.message = err.message;
  return res.status(500).json(response);
}
});



export default router;
