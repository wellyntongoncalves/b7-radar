/**
 * B7 Radar database schema (Drizzle / PostgreSQL, targeting Supabase).
 * All timestamps are stored in UTC. Money is stored in integer cents.
 * Fees and formulas are versioned so historical calculations stay reproducible.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const createdAt = timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  providerId: text('provider_id'),
  status: text('status').notNull().default('active'),
  createdAt,
  updatedAt,
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  plan: text('plan').notNull().default('free'),
  createdAt,
  updatedAt,
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').notNull().default('member'),
    createdAt,
  },
  (t) => ({ pk: primaryKey({ columns: [t.workspaceId, t.userId] }) }),
);

export const marketplaceConnections = pgTable('marketplace_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  marketplace: text('marketplace').notNull(),
  externalUserId: text('external_user_id'),
  // Tokens stored encrypted at rest (AES-256-GCM); never logged.
  encryptedAccessToken: text('encrypted_access_token'),
  encryptedRefreshToken: text('encrypted_refresh_token'),
  scopes: text('scopes').array(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  status: text('status').notNull().default('active'),
  createdAt,
  updatedAt,
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  sku: text('sku'),
  title: text('title').notNull(),
  costCents: integer('cost_cents').notNull().default(0),
  extraCostCents: integer('extra_cost_cents').notNull().default(0),
  taxRate: numeric('tax_rate', { precision: 6, scale: 3 }).notNull().default('0'),
  desiredMargin: numeric('desired_margin', { precision: 6, scale: 3 }),
  createdAt,
  updatedAt,
});

export const sellers = pgTable('sellers', {
  id: uuid('id').defaultRandom().primaryKey(),
  marketplace: text('marketplace').notNull(),
  externalSellerId: text('external_seller_id').notNull(),
  publicName: text('public_name'),
  location: text('location'),
  reputation: text('reputation'),
  officialStore: boolean('official_store').notNull().default(false),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  marketplace: text('marketplace').notNull(),
  externalCategoryId: text('external_category_id').notNull(),
  name: text('name').notNull(),
  parentId: uuid('parent_id'),
});

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    marketplace: text('marketplace').notNull(),
    externalListingId: text('external_listing_id').notNull(),
    externalSellerId: text('external_seller_id'),
    categoryId: text('category_id'),
    catalogProductId: text('catalog_product_id'),
    title: text('title'),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    listingType: text('listing_type'),
    status: text('status'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ byExternal: index('listings_external_idx').on(t.marketplace, t.externalListingId) }),
);

export const listingSnapshots = pgTable(
  'listing_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id),
    capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
    priceCents: integer('price_cents'),
    originalPriceCents: integer('original_price_cents'),
    soldQuantity: integer('sold_quantity'),
    estimatedSoldQuantity: integer('estimated_sold_quantity'),
    availableQuantity: integer('available_quantity'),
    shippingCostCents: integer('shipping_cost_cents'),
    shippingType: text('shipping_type'),
    reviewCount: integer('review_count'),
    rating: numeric('rating', { precision: 3, scale: 2 }),
    sellerReputation: text('seller_reputation'),
    sourceMetadata: jsonb('source_metadata'),
    confidenceMetadata: jsonb('confidence_metadata'),
  },
  (t) => ({ byListingTime: index('snapshots_listing_time_idx').on(t.listingId, t.capturedAt) }),
);

export const feeSchedules = pgTable('fee_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  marketplace: text('marketplace').notNull(),
  version: text('version').notNull(),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  source: text('source').notNull().default('DEFAULT'),
  data: jsonb('data').notNull(),
  createdAt,
});

export const costProfiles = pgTable('cost_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  name: text('name').notNull(),
  productCostCents: integer('product_cost_cents').notNull().default(0),
  packagingCostCents: integer('packaging_cost_cents').notNull().default(0),
  extraCostsCents: integer('extra_costs_cents').notNull().default(0),
  taxRate: numeric('tax_rate', { precision: 6, scale: 3 }).notNull().default('0'),
  advertisingRate: numeric('advertising_rate', { precision: 6, scale: 3 }).notNull().default('0'),
  returnRate: numeric('return_rate', { precision: 6, scale: 3 }).notNull().default('0'),
  shippingSettings: jsonb('shipping_settings'),
  createdAt,
  updatedAt,
});

export const calculations = pgTable('calculations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  listingId: uuid('listing_id').references(() => listings.id),
  inputs: jsonb('inputs').notNull(),
  outputs: jsonb('outputs').notNull(),
  formulaVersion: text('formula_version').notNull(),
  createdAt,
});

export const trackedEntities = pgTable('tracked_entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  trackingSettings: jsonb('tracking_settings'),
  createdAt,
});

export const searchMonitors = pgTable('search_monitors', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  query: text('query').notNull(),
  filters: jsonb('filters'),
  frequency: text('frequency').notNull().default('daily'),
  status: text('status').notNull().default('active'),
  createdAt,
});

export const alertRules = pgTable('alert_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  entityType: text('entity_type').notNull(),
  metric: text('metric').notNull(),
  operator: text('operator').notNull(),
  threshold: numeric('threshold', { precision: 14, scale: 4 }).notNull(),
  channel: text('channel').notNull().default('in_app'),
  enabled: boolean('enabled').notNull().default(true),
});

export const alertEvents = pgTable('alert_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  ruleId: uuid('rule_id')
    .notNull()
    .references(() => alertRules.id),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }).defaultNow().notNull(),
  payload: jsonb('payload'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  metadata: jsonb('metadata'),
  createdAt,
});
