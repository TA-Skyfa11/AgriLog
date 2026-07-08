import mongoose, { Document, Schema, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface IOrderItem {
  product: Types.ObjectId;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface IOrder extends Document {
  farm: Types.ObjectId;
  company: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: OrderStatus;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, default: 0 },
    commissionRate: { type: Number, required: true, default: 0 },
    commissionAmount: { type: Number, required: true, default: 0 },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
