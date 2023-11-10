import mongoose from 'mongoose';

const { Schema } = mongoose;

const TambolaTicketSchema = new Schema(
  {
    ticketid: {
      type: Number,
      required: [true, "can't be blank"],
      index: true
    },
    C1: {
      type: Number,
      default: 0
    },
    C2: {
      type: Number,
      default: 0
    },
    C3: {
      type: Number,
      default: 0
    },
    C4: {
      type: Number,
      default: 0
    },
    C5: {
      type: Number,
      default: 0
    },
    C6: {
      type: Number,

      default: 0
    },
    C7: {
      type: Number,
      default: 0
    },
    C8: {
      type: Number,
      default: 0
    },
    C9: {
      type: Number,
      default: 0
    },
    C10: {
      type: Number,
      default: 0
    },
    C11: {
      type: Number,
      default: 0
    },
    C12: {
      type: Number,
      default: 0
    },
    C13: {
      type: Number,
      default: 0
    },
    C14: {
      type: Number,
      default: 0
    },
    C15: {
      type: Number,
      default: 0
    },
    C16: {
      type: Number,
      default: 0
    },
    C17: {
      type: Number,
      default: 0
    },
    C18: {
      type: Number,
      default: 0
    },
    C19: {
      type: Number,
      default: 0
    },
    C20: {
      type: Number,
      default: 0
    },
    C21: {
      type: Number,
      default: 0
    },
    C22: {
      type: Number,
      default: 0
    },
    C23: {
      type: Number,
      default: 0
    },
    C24: {
      type: Number,
      default: 0
    },
    C25: {
      type: Number,
      default: 0
    },
    C26: {
      type: Number,
      default: 0
    },
    C27: {
      type: Number,
      default: 0
    },
  }
);



TambolaTicketSchema.methods.toJSON = function () {

  return {
    id: this._id,
    ticketid: this.ticketid,
    C1: this.C1,
    C2: this.C2,
    C3: this.C3,
    C4: this.C4,
    C5: this.C5,
    C6: this.C6,
    C7: this.C7,
    C8: this.C8,
    C9: this.C9,
    C10: this.C10,
    C11: this.C11,
    C12: this.C12,
    C13: this.C13,
    C14: this.C14,
    C15: this.C15,
    C16: this.C16,
    C17: this.C17,
    C18: this.C18,
    C19: this.C19,
    C20: this.C20,
    C21: this.C21,
    C22: this.C22,
    C23: this.C23,
    C24: this.C24,
    C25: this.C25,
    C26: this.C26,
    C27: this.C27,
  };
};



const TambolaTicket = mongoose.model('TambolaTicket', TambolaTicketSchema);

export default TambolaTicket;