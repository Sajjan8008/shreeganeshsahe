import mongoose from 'mongoose';

const { Schema } = mongoose;

const OtpSchema = new Schema(
  {
   mobile: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      unique : true
    },
    otp: {
      type: Number,
    },
    status: {
      type:Boolean ,
      default: false,
    },
  }
);



OtpSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    mobile: this.mobile,
    otp:this.otp,
    status:this.status
  };
};



const Otp = mongoose.model('Otp', OtpSchema);

export default Otp;