import mongoose from 'mongoose';

const { Schema } = mongoose;

const PaymentsSchema = new Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentTxn: {
      type: String,
      default: '',
    },
    mode : {
      type: String
    },
    amount: {
      type:Number,
      required: [true, "Amount can't be blank"],
    },
    type: {
      type: String,
      enum: ['ADD','SUBTRACT','REVERSE','WITHDRAW'],
      required: [true, "Type can't be blank"],
    }, 
    txn_time : {
      type: Date
  },
  // 0 pending, 1 failed, 2 completed 
  txn_status : {
    type: Number,
    default:0,
},
  paymentDetails: {
    type:Object,
    default: '',
  },
  paymentImage: {
    type: String,
    default: ''
  },
  paymentType: {
    type: String,
    default: ''
  },
  reason : {
    type: String,
    default: ''
  },
  },
  { timestamps: true },
);



PaymentsSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    idd: parseInt(((this._id).toString()).slice(-6),16),
    userid : this.userid,
    paymentTxn: this.paymentTxn,
    paymentDetails:this.paymentDetails,
    mode:this.mode,
    amount:this.amount,
    type:this.type,
    txn_time:this.txn_time,
    txn_status:this.txn_status,
    paymentImage:this.paymentImage,
    createdAt : this.createdAt,
    updatedAt : this.updatedAt,
    paymentType: this.paymentType,
    reason : this.reason
  };
};


const Payment = mongoose.model('Payment', PaymentsSchema);

export default Payment;