import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';


const { Schema } = mongoose;

const userSchema = new Schema(
  {
    provider: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },
    device_id: {
      type: String,
      trim: true,
      default:''
    },
    password: {
      type: String,
      trim: true,
    },
    // optional
    name: {
      type: String,
    },
    // Phone is optional
    phone: {
      type: String,
      default: ''
    },
    // Email is optional
    email: {
      type: String,
      default: ''
    },
    // Email is optional
    coins: {
      type: Number,
      default:0
    },
    betting_points: {
      type: Number,
      default:0
    },
    daily_play_points: {
      type: Number,
      default:0
    },
    daily_winning_points: {
      type: Number,
      default:0
    },
    winning: {
      type: Number,
      default:0
    },
    play_point_update: {
      type: String
    },
    profit_loss: {
      type: Number,
      default:0
    },
    commission: {
      type: Number,
      default:0
    },
    loginAgain: {
      type: Number,
      default:0,
    },
    refer_code: {
      type: String,
      default:'',
    },
    daily_rewards_claim: {
      type: Date,
      default: () => Date.now() - (7*24*60*60*1000)
    },
    daily_rewards_day: {
      type:Number,
      default:0
    },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role'},
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: Boolean,
      default: true,
    },
    token: {
      type: String,
      default: '',
    },
    otp_state: {
      type: Boolean,
      default: false,
    },
    image: {
      type: Number,
      default: 0
    },
    otp: {
      type: Number,
      default: ''
    },
    games: {
      type: Array,
      default: '',
    },
    appversion: {
      type: String,
      default: '',
    },
    current_game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    cashflow: {
      online_add_coins: { type: Number, default:0 },
      offline_add_coins: {type: Number, default:0 },
      bonus_coins: {type: Number, default:0 },
      winning_coins : { type: Number, default:0 },
      withdraw : { type: Number, default:0 },
    },
    boat: {
      type: Boolean,
      default: false
    },
    alreadyConnected : {
      type: Boolean,
      default: false
 
    },
    lockedmoney: {
      type : Number,
      default: 0
    },
    displayid: {
      type: Number,
      default:0
    },
    upi: {
      type: String,
      default: ''
    },
    account: {
      type: String,
      default: ''
    },
    customerIp: {
      type: String,
      default: ''
    },
    deviceName: {
      type: String,
      default: ''
    },
    os: {
      type: String,
      default: ''
    },
    prime: {
      type: Boolean,
      default: false 
    }  
  },

  { timestamps: true },
);  


userSchema.methods.toJSON = function () {
  return {
    id: this._id,
    provider: this.provider,
    email: this.email,
    phone: this.phone,
    username: this.username,
    device_id:this.device_id,
    name: this.name,
    role: this.role,
    parent:this.parent,
    image: this.image,
    coins: this.coins,
    betting_points: this.betting_points,
    profit_loss: this.profit_loss,
    commission: this.commission,
    loginAgain: this.loginAgain,
    refer_code: this.refer_code,
    daily_rewards_claim:this.daily_rewards_claim,
    daily_rewards_day:this.daily_rewards_day,
    status: this.status,
    token: this.token,
    updatedAt: this.updatedAt,
    current_game: this.current_game,
    daily_play_points: this.daily_play_points,
    daily_winning_points: this.daily_winning_points,
    winning: this.winning,
    play_point_update: this.play_point_update,
    games: this.games,
    cashflow : this.cashflow,
    boat: this.boat,
    alreadyConnected : this.alreadyConnected,
    lockedmoney: this.lockedmoney,
    displayid:this.displayid,
    upi:this.upi,
    account:this.account,
    appversion:this.appversion,
    createdAt : this.createdAt,
    deviceName: this.deviceName,
    customerIp: this.customerIp,
    os: this.os,
    prime:this.prime     
  };
};

const isProduction = process.env.NODE_ENV === 'production.js';
const secretOrKey = isProduction ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;

userSchema.methods.generateJWT = function (appversion) {
  const token = jwt.sign(
    {
      expiresIn: '12h',
      id: this._id,
      provider: this.provider,
      username: this.username,
    },
    secretOrKey,
  );

  User.updateOne({ "_id" : this._id},{"token" : token, "appversion" : appversion}).exec();
  
  // todo to save token
  
  return token;
};


userSchema.methods.registerUser = (newUser, callback) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (errh, hash) => {
      if (err) {
        console.log(err);
      }
      
      // set pasword to hash
      newUser.password = hash;
      newUser.save(callback);
    });
  });
};

userSchema.methods.getUserWithRole = async(newUser) => {
  
  let user = await User.findById(newUser._id).populate('role').exec();
  
  return user;
};

userSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

// const delay = (t, ...vs) => new Promise(r => setTimeout(r, t, ...vs)) or util.promisify(setTimeout)

export async function hashPassword(password) {
  const saltRounds = 10;

  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) reject(err);
      else resolve(hash);
    });
  });

  return hashedPassword;
}

export const validateUser = (user) => {
  const schema = {
    username: Joi.string().required(),
    password: Joi.required(),
  };

  return Joi.validate(user, schema);
};

const User = mongoose.model('User', userSchema);

export default User;
