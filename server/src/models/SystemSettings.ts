import mongoose, { Document, Schema } from 'mongoose';

export type EmailProvider = 'smtp' | 'resend';

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
  // Provider selection — optional so || falls through to env var when not explicitly saved
  emailProvider?: EmailProvider;
  // Resend
  resendApiKey:   string;
  resendFromEmail: string;
  resendFromName:  string;
  // SMTP (fallback)
  smtpHost:       string;
  smtpPort:       number;
  smtpUser:       string;
  smtpPass:       string;
  smtpFromEmail:  string;
  smtpFromName:   string;
  smtpTls:        boolean;
  // Operational alert recipients — if empty, falls back to admin/project_manager users
  notificationRecipients: string[];
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
  emailProvider:          { type: String, enum: ['smtp', 'resend'] }, // no default — lets env var work for unset docs
  resendApiKey:           { type: String, default: '' },
  resendFromEmail:        { type: String, default: '' },
  resendFromName:         { type: String, default: 'Mirsad Alerts' },
  smtpHost:               { type: String, default: '' },
  smtpPort:               { type: Number, default: 587 },
  smtpUser:               { type: String, default: '' },
  smtpPass:               { type: String, default: '' },
  smtpFromEmail:          { type: String, default: '' },
  smtpFromName:           { type: String, default: 'Mirsad' },
  smtpTls:                { type: Boolean, default: false },
  notificationRecipients: { type: [String], default: [] },
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

export async function getSystemSettings(): Promise<ISystemSettings> {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({ emailAlerts: defaultAlerts });
  }
  return settings;
}
