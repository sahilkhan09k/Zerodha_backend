import mongoose, {Schema} from "mongoose";

const holdingsSchema = new Schema({
    name : String,
    qty : Number,
    avg : Number,
    price : Number,
    net : String,
    day : String,
});

export const Holding = mongoose.model("Holding", holdingsSchema);
