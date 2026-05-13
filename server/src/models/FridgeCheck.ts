import mongoose, { Document, Schema } from 'mongoose';

export type FridgeCheckStatus = 'ok' | 'issue_found' | 'corrective_action_required';
export type FridgeItemCondition = 'good' | 'damaged' | 'expired' | 'near_expiry';
export type StorageZone = 'cold' | 'chilled' | 'freezer' | 'ambient' | 'dry_storage' | 'coffee_station' | 'hospitality';

export interface IFridgeCheckItem {
  _id?: mongoose.Types.ObjectId;
  batch:        mongoose.Types.ObjectId;
  item:         mongoose.Types.ObjectId;
  expiryDate:   Date;
  isExpired:    boolean;
  isNearExpiry: boolean;
  quantity:     number;
  condition:    FridgeItemCondition;
  nameTagPresent: boolean;
  notes?:       string;
}

export interface IFridgeCheck extends Document {
  organization?:    mongoose.Types.ObjectId;
  date:             Date;
  floor:            mongoose.Types.ObjectId;
  building:         mongoose.Types.ObjectId;
  project:          mongoose.Types.ObjectId;
  storageZone:      StorageZone;
  checkedBy:        mongoose.Types.ObjectId;
  temperature:      number;
  expectedTempMin:  number;
  expectedTempMax:  number;
  cleanlinessOk:    boolean;
  cleanlinessNotes?: string;
  itemsChecked:     IFridgeCheckItem[];
  status:           FridgeCheckStatus;
  correctiveActionId?: mongoose.Types.ObjectId;
}

const fridgeCheckItemSchema = new Schema<IFridgeCheckItem>({
  batch:          { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  item:           { type: Schema.Types.ObjectId, ref: 'Item',  required: true },
  expiryDate:     { type: Date, required: true },
  isExpired:      { type: Boolean, default: false },
  isNearExpiry:   { type: Boolean, default: false },
  quantity:       { type: Number, required: true, min: 0 },
  condition:      { type: String, enum: ['good','damaged','expired','near_expiry'], default: 'good' },
  nameTagPresent: { type: Boolean, default: true },
  notes:          String,
}, { _id: true });

const fridgeCheckSchema = new Schema<IFridgeCheck>({
  organization:     { type: Schema.Types.ObjectId, ref: 'Organization' },
  date:             { type: Date, required: true },
  floor:            { type: Schema.Types.ObjectId, ref: 'Floor',    required: true },
  building:         { type: Schema.Types.ObjectId, ref: 'Building', required: true },
  project:          { type: Schema.Types.ObjectId, ref: 'Project',  required: true },
  storageZone:      { type: String, enum: ['cold','chilled','freezer','ambient','dry_storage','coffee_station','hospitality'], required: true },
  checkedBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  temperature:      { type: Number, required: true },
  expectedTempMin:  { type: Number, required: true },
  expectedTempMax:  { type: Number, required: true },
  cleanlinessOk:    { type: Boolean, required: true },
  cleanlinessNotes: String,
  itemsChecked:     [fridgeCheckItemSchema],
  status:           { type: String, enum: ['ok','issue_found','corrective_action_required'], default: 'ok' },
  correctiveActionId: { type: Schema.Types.ObjectId, ref: 'CorrectiveAction' },
}, { timestamps: true });

fridgeCheckSchema.index({ organization: 1, project: 1, status: 1, date: -1 });
fridgeCheckSchema.index({ project: 1, status: 1, date: -1 });
fridgeCheckSchema.index({ floor: 1, date: -1 });

export const FridgeCheck = mongoose.model<IFridgeCheck>('FridgeCheck', fridgeCheckSchema);
