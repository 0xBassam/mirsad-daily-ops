import mongoose, { Document, Schema } from 'mongoose';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'coffee_break';

export interface IMenuItem {
  name:      string;
  quantity:  number;
  unit?:     string;
  notes?:    string;
}

export interface IMenu extends Document {
  date:      Date;
  project:   mongoose.Types.ObjectId;
  mealType:  MealType;
  items:     IMenuItem[];
  notes?:    string;
  status:    'active' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>({
  name:     { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit:     { type: String, default: '' },
  notes:    { type: String, default: '' },
}, { _id: true });

const MenuSchema = new Schema<IMenu>({
  date:      { type: Date, required: true },
  project:   { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  mealType:  { type: String, enum: ['breakfast', 'lunch', 'dinner', 'coffee_break'], required: true },
  items:     { type: [MenuItemSchema], default: [] },
  notes:     { type: String, default: '' },
  status:    { type: String, enum: ['active', 'archived'], default: 'active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

MenuSchema.index({ date: 1, project: 1 });

export const Menu = mongoose.model<IMenu>('Menu', MenuSchema);
