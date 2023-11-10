import mongoose from 'mongoose';

const { Schema } = mongoose;

const TransactionSchema = new Schema(
  {
   
    type: {
      type: String,
      enum: ['ADD','SUBTRACT','REVERSE','WITHDRAW'],
      required: [true, "can't be blank"],
    },
    betting_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Betting' },
    game_history_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
    game_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment:{
      type: String,
    },  
    trans_coins:{
      type: Number,
      required: [true, "can't be blank"],
    },
    remaining_coins: {
      type: Number,
      required: [true, "can't be blank"],
    } 
  },
  { timestamps: true },
);

// Query to check small id in
// db.getCollection("transactions").aggregate([
//   {
//     $addFields: {
//       tempId: { $toString: '$_id' },
//     }
//   },
//   {
//     $match: {
//       tempId: { $regex: "f0e1cc"}
//     }
//   }
// ])


TransactionSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    idd: (this._id).toString().slice(-6),
    type: this.type,
    betting_id: this.betting_id,
    toUser: this.toUser,
    game_history_id: this.game_history_id,
    game_id: this.game_id,
    fromUser:this.fromUser,
    trans_coins: this.trans_coins,
    comment:this.comment,
    remaining_coins: this.remaining_coins,
    createdAt : this.createdAt,
    updatedAt : this.updatedAt,
  };
};



const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;