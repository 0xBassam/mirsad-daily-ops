import mongoose, { Document, Schema } from 'mongoose';

export type OrgPlan = 'trial' | 'starter' | 'professional' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'cancelled' | 'trial';

export interface IOrganizationSettings {
  // Email
  emailProvider?: 'smtp' | 'resend';
  resendApiKey?: string;
  resendFromEmail?: string;
  resendFromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpTls?: boolean;
  notificationRecipients?: string[];
  // Branding
  logoUrl?: string;
  primaryColor?: string;
  siteName?: string;
  department?: string;
  // Alerts (mirrors old SystemSettings.emailAlerts)
  emailAlerts?: {
    clientRequestCreated?: boolean;
    clientRequestAssigned?: boolean;
    clientRequestDelivered?: boolean;
    clientRequestConfirmed?: boolean;
    lowStock?: boolean;
    outOfStock?: boolean;
    newPurchaseOrder?: boolean;
    receivingCompleted?: boolean;
    maintenanceOpened?: boolean;
    maintenanceCompleted?: boolean;
  };
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  plan: OrgPlan;
  planExpiresAt?: Date;
  trialEndsAt?: Date;
  maxUsers: number;
  maxProjects: number;
  storageLimitMb: number;
  featureFlags: Map<string, boolean>;
  status: OrgStatus;
  suspendedAt?: Date;
  suspendedReason?: string;
  settings: IOrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

const defaultFeatureFlags: Record<string, boolean> = {
  dailyPlans: true,
  floorChecks: true,
  inventory: true,
  purchaseOrders: true,
  suppliers: true,
  batches: true,
  transfers: true,
  receiving: true,
  maintenance: true,
  clientRequests: true,
  fridgeChecks: true,
  correctiveActions: true,
  advancedReports: true,
  export: true,
  whiteLabel: false,
};

const PLAN_LIMITS: Record<OrgPlan, { maxUsers: number; maxProjects: number; storageLimitMb: number }> = {
  trial:        { maxUsers: 5,   maxProjects: 1,  storageLimitMb: 500 },
  starter:      { maxUsers: 20,  maxProjects: 3,  storageLimitMb: 2048 },
  professional: { maxUsers: 100, maxProjects: 10, storageLimitMb: 10240 },
  enterprise:   { maxUsers: 999, maxProjects: 99, storageLimitMb: 102400 },
};

const orgSettingsSchema = new Schema<IOrganizationSettings>(
  {
    emailProvider:          { type: String, enum: ['smtp', 'resend'] },
    resendApiKey:           { type: String, default: '' },
    resendFromEmail:        { type: String, default: '' },
    resendFromName:         { type: String, default: 'Mirsad' },
    smtpHost:               { type: String, default: '' },
    smtpPort:               { type: Number, default: 587 },
    smtpUser:               { type: String, default: '' },
    smtpPass:               { type: String, default: '' },
    smtpFromEmail:          { type: String, default: '' },
    smtpFromName:           { type: String, default: 'Mirsad' },
    smtpTls:                { type: Boolean, default: false },
    notificationRecipients: { type: [String], default: [] },
    logoUrl:                { type: String, default: '' },
    primaryColor:           { type: String, default: '' },
    siteName:               { type: String, default: '' },
    department:             { type: String, default: '' },
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
  },
  { _id: false }
);

const organizationSchema = new Schema<IOrganization>(
  {
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
    contactName:     { type: String, trim: true },
    contactEmail:    { type: String, trim: true, lowercase: true },
    contactPhone:    { type: String, trim: true },
    address:         { type: String, trim: true },
    plan:            { type: String, enum: ['trial', 'starter', 'professional', 'enterprise'], default: 'trial' },
    planExpiresAt:   { type: Date },
    trialEndsAt:     { type: Date },
    maxUsers:        { type: Number, default: PLAN_LIMITS.trial.maxUsers },
    maxProjects:     { type: Number, default: PLAN_LIMITS.trial.maxProjects },
    storageLimitMb:  { type: Number, default: PLAN_LIMITS.trial.storageLimitMb },
    featureFlags:    { type: Map, of: Boolean, default: defaultFeatureFlags },
    status:          { type: String, enum: ['active', 'suspended', 'cancelled', 'trial'], default: 'trial' },
    suspendedAt:     { type: Date },
    suspendedReason: { type: String },
    settings:        { type: orgSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

organizationSchema.index({ status: 1 });
organizationSchema.index({ plan: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

export function getPlanLimits(plan: OrgPlan) {
  return PLAN_LIMITS[plan];
}
