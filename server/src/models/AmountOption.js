import mongoose from 'mongoose';

const { Schema } = mongoose;

const AmountOptionSchema = new Schema(
  {
   
    amount: {
      type: Number,
      required: [true, "can't be blank"],
      unique: true,
    },
    cashback: {
      type: Number,
      required: [true, "can't be blank"]
    },
    status: {
      type:Boolean,
      default: true,
    },
  }
);



AmountOptionSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name: this.amount,
    cashback: this.cashback,
    status:this.status
  };
};



const AmountOption = mongoose.model('AmountOption', AmountOptionSchema);

export default AmountOption;