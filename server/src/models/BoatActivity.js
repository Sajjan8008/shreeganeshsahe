import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';


const { Schema } = mongoose;

const BoatActivity = new Schema(
  {
    option: {
      type: String,
      required: [true, "can't be blank"],
    },
    roundCount: {
      type : Number,
      default: 0
    }
  }
);  


BoatActivity.methods.toJSON = function () {
  return {
    id: this._id,
    option: this.option,
    roundCount: this.roundCount 

};
};


const BoatActivityTable = mongoose.model('BoatActivity', BoatActivity);

export default BoatActivityTable;
