import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';


const { Schema } = mongoose;

const BoatUserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "can't be blank"],
    },
    coins: {
      type: Number,
      default:0
    },
    image: {
      type: Number,
      default: 0
    },
    game_history: { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
  },
  { timestamps: true },
);  


BoatUserSchema.methods.toJSON = function () {
  return {
    id: this._id,
    username: this.username,
    coins: this.coins,
    image: this.image,
    game_history: this.game_history,
};
};


const BoatUser = mongoose.model('BoatUser', BoatUserSchema);

export default BoatUser;
