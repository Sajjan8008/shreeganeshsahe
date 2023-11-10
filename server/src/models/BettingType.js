import mongoose from 'mongoose';

const { Schema } = mongoose;

const BettingTypeSchema = new Schema(
  {
   
    // Betting names outside - Front line(1 to 1), Dozens(2 to 1), Column(2 to 1)
    // Betting name inside - Single Number(35 to 1),  Split(17 to 1), Corners( 8 to 1), 
    // Street (11 to 1), Double Street (5 to 1), Top line (6 to 1)   
    name: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "can't be blank"],
    },
    // Inside/outside
    category: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    
    winning_x: {
      type: Number,
      
    },
    count: {
      type: Number,
      
    },
    status: {
      type: Boolean,
      lowercase: true,
      default: true,
    },
    game: {type: mongoose.Schema.Types.ObjectId, ref: 'Game'},
    max_amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);



BettingTypeSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name: this.name,
    description:this.description,
    category:this.category,
    winning_x: this.winning_x,
    count: this.count,
    game:this.game,
    status:this.status,
    max_amount:this.max_amount
  };
};



const BettingType = mongoose.model('BettingType', BettingTypeSchema);

export default BettingType;