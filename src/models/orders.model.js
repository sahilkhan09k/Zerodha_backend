import mongoose, {Schema} from "mongoose";

const ordersSchema = new Schema({
    name: String,
    qty: Number,
    price : Number,
    mode : String,
});

export const Order = mongoose.model("Order", ordersSchema);
