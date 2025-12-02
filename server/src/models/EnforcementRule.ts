import mongoose, { Schema, Document } from 'mongoose';

/**
 * EnforcementRule Model
 *
 * Stores programmatic enforcement rules for state-specific PA compliance.
 * These are "hard business rules" that BLOCK illegal actions or WARN users
 * about violations before they happen.
 *
 * Different from ComplianceRule which stores general compliance information,
 * EnforcementRules are actively enforced by ComplianceEngine during contract
 * creation, fee calculation, and solicitation activities.
 */

export interface IEnforcementRule extends Document {
  stateCode: string;
  stateName?: string;
  category: string;
  description: string;
  isActive: boolean;
  logicType: string;
  thresholdValue: any;
  severity: 'BLOCK_ACTION' | 'WARN_BLOCK' | 'WARN_CONTINUE' | 'INFO_ONLY' | 'WARNING_ONLY';
  errorMessage: string;
  legalBasis?: {
    statute?: string;
    regulation?: string;
    effectiveDate?: Date;
    url?: string;
    notes?: string;
    consequences?: string[];
  };
  allowedTypes?: string[];
  prohibitedTypes?: string[];
  allowedFeeTypes?: string[];
  prohibitedFeeTypes?: string[];
  applicableToAll?: boolean;
  noExceptions?: boolean;
  verifiedDate?: Date;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt?: Date;
  updatedAt?: Date;
}

const EnforcementRuleSchema: Schema = new Schema(
  {
    stateCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
      trim: true,
      description: 'Two-letter state code (e.g., FL, TX) or DEFAULT_GREEN for fallback rules'
    },
    stateName: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'LICENSE_RESTRICTION',
        'FEE_CAP',
        'FEE_STRUCTURE',
        'CATASTROPHE_RESTRICTION',
        'CONTRACT_REQUIREMENT',
        'SCOPE_OF_PRACTICE',
        'UPL_PREVENTION',
        'SOLICITATION',
        'RESCISSION',
        'TIME_RESTRICTION'
      ],
      index: true,
      description: 'Type of restriction or requirement being enforced'
    },
    description: {
      type: String,
      required: true,
      description: 'Human-readable description of the rule'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
      description: 'Whether this rule is currently enforced'
    },
    logicType: {
      type: String,
      required: true,
      enum: [
        'FORBIDDEN_KEYWORD',       // AL, AR: Block specific keywords
        'FORBIDDEN_ACTION',        // Complete action ban
        'FORBIDDEN_FEE_TYPE',      // LA: Block percentage fees
        'FORBIDDEN_SERVICE',       // NY: Block legal advice
        'MAX_PERCENTAGE',          // TN, MS, IL: Simple fee caps
        'DYNAMIC_CAP',             // FL, NC, KY: Context-based caps
        'SLIDING_SCALE',           // DE: Tiered fee structure
        'TIME_WINDOW',             // FL: 8AM-8PM solicitation
        'TIME_BASED_RESTRICTION',  // TX: 72hr ban
        'EVENT_BASED_RESTRICTION', // NC: Hurricane-triggered ban
        'LANGUAGE_REQUIREMENT',    // PR: Spanish required
        'REQUIRED_DISCLOSURE',     // Rescission periods
        'DYNAMIC_RESCISSION'       // CA: Variable rescission periods
      ],
      description: 'Logic engine type for rule evaluation'
    },
    thresholdValue: {
      type: Schema.Types.Mixed,
      required: true,
      description: 'Rule-specific threshold (array, object, number, etc.)'
    },
    severity: {
      type: String,
      required: true,
      enum: ['BLOCK_ACTION', 'WARN_BLOCK', 'WARN_CONTINUE', 'INFO_ONLY', 'WARNING_ONLY'],
      default: 'WARN_CONTINUE',
      description: 'Enforcement severity level'
    },
    errorMessage: {
      type: String,
      required: true,
      description: 'User-facing error message when rule is violated'
    },
    legalBasis: {
      statute: {
        type: String,
        description: 'Statute citation (e.g., "F.S. 626.854")'
      },
      regulation: {
        type: String,
        description: 'Regulation or administrative code'
      },
      effectiveDate: {
        type: Date,
        description: 'When this law/regulation took effect'
      },
      url: {
        type: String,
        description: 'Direct URL to DOI source'
      },
      notes: {
        type: String,
        description: 'Additional context or interpretation notes'
      },
      consequences: [{
        type: String,
        description: 'Legal consequences of violation'
      }]
    },
    allowedTypes: [{
      type: String,
      description: 'Permitted claim/fee types (e.g., ["COMMERCIAL"])'
    }],
    prohibitedTypes: [{
      type: String,
      description: 'Forbidden claim/fee types (e.g., ["RESIDENTIAL"])'
    }],
    allowedFeeTypes: [{
      type: String,
      description: 'Permitted billing methods (e.g., ["HOURLY", "FLAT_FEE"])'
    }],
    prohibitedFeeTypes: [{
      type: String,
      description: 'Forbidden billing methods (e.g., ["PERCENTAGE"])'
    }],
    applicableToAll: {
      type: Boolean,
      default: false,
      description: 'Whether rule applies to all claim types without exception'
    },
    noExceptions: {
      type: Boolean,
      default: false,
      description: 'Whether rule has zero exceptions or carve-outs'
    },
    verifiedDate: {
      type: Date,
      default: Date.now,
      description: 'Date rule was last verified with DOI'
    },
    confidenceLevel: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      description: 'Confidence in accuracy based on source quality'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient state + category + active queries
EnforcementRuleSchema.index({ stateCode: 1, category: 1, isActive: 1 });

// Index for severity-based lookups (BLOCK_ACTION rules)
EnforcementRuleSchema.index({ isActive: 1, severity: 1 });

// Index for verification date (stale data detection)
EnforcementRuleSchema.index({ verifiedDate: 1 });

// Text index for search
EnforcementRuleSchema.index({ description: 'text', errorMessage: 'text' });

export default mongoose.model<IEnforcementRule>('EnforcementRule', EnforcementRuleSchema);
