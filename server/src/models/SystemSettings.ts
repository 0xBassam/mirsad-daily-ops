import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailAlerts {
  clientRequestCreated:   boolean;
  clientRequestAssigned:  boolean;
  clientRequestDelivered: boolean;
  clientRequestConfirmed: boolean;
  lowStock:               boolean;
  outOfStock:             boolean;
  newPurchaseOrder:       boolean;
  receivingCompleted:     boolean;
  maintenanceOpened:      boolean;
  maintenanceCompleted:   boolean;
}

export interface ISystemSettings extends Document {
  smtpHost:       string;
  smtpPort:       number;
  smtpUser:       string;
  smtpPass:       string;
  smtpFromEmail:  string;
  smtpFromName:   string;
  smtpTls:        boolean;
  emailAlerts:    IEmailAlerts;
}

const defaultAlerts: IEmailAlerts = {
  clientRequestCreated:   true,
  clientRequestAssigned:  true,
  clientRequestDelivered: true,
  clientRequestConfirmed: true,
  lowStock:               true,
  outOfStock:             true,
  newPurchaseOrder:       false,
  receivingCompleted:     false,
  maintenanceOpened:      true,
  maintenanceCompleted:   true,
};

const systemSettingsSchema = new Schema<ISystemSettings>({
  smtpHost:      { type: String, default: '' },
  smtpPort:      { type: Number, default: 587 },
  smtpUser:      { type: String, default: '' },
  smtpPass:      { type: String, default: '' },
  smtpFromEmail: { type: String, default: '' },
  smtpFromName:  { type: String, default: 'Mirsad' },
  smtpTls:       { type: Boolean, default: false },
  emailAlerts: {
    clientRequestCreated:   { type: Boolean, default: true },
    clientRequestAssigned:  { type: Boolean, default: true },
    clientRequestDelivered: { type: Boolean, default: true },
    clientRequestConfirmed: { type: Boolean, default: true },
    lowStock:               { type: Boolean, default: true },
    outOfStock:             { type: Boolean, default: true },
    newPurchaseOrder:       { type: Boolean, default: false },
    receivingCompleted:     { type: Boolean, default: false },
    maintenanceOpened:      { type: Boolean, default: true },
    maintenanceCompleted:   { type: Boolean, default: true },
  },
}, { timestamps: true });

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

// Singleton getter – always returns the one settings document
export async function getSystemSettings(): Promise<ISystemSettings> {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({ emailAlerts: defaultAlerts });
  }
  return settings;
}
