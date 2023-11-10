import mongoose from 'mongoose';

const { Schema } = mongoose;

const FeedbackSchema = new Schema(
  {
   message: {
      type: String,
      required: [true, "can't be blank"],
    },
    user :{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type:Boolean ,
      default: false,
    },
  },
  { timestamps: true },
);



FeedbackSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    message: this.message,
    user:this.user,
    status: this.status,
    createdAt:this.createdAt,
  };
};



const feedback = mongoose.model('Feedback', FeedbackSchema);

export default feedback;