import ComplianceRule from '../models/ComplianceRule';

/**
 * Compliance Engine - Enforces state-specific PA compliance rules
 *
 * This engine validates contracts, fees, and actions against state-specific
 * compliance rules loaded from the database. It implements the color-coded
 * zone system:
 *
 * 🔴 RED ZONE: Total bans (AL, AR, AK, SD) - BLOCK all PA activity
 * 🟠 ORANGE ZONE: Partial bans (KS residential, LA contingency) - BLOCK specific types
 * 🟡 YELLOW ZONE: Strict fee caps - BLOCK fees exceeding limits
 * 🟢 GREEN ZONE: Standard rules - WARNING only for excessive fees
 */

export interface ComplianceValidationResult {
  isValid: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  blockedActions: string[];
}

export interface ComplianceViolation {
  ruleId: string;
  stateCode: string;
  category: string;
  severity: 'BLOCK_ACTION' | 'WARN_BLOCK' | 'WARN_CONTINUE' | 'INFO_ONLY';
  errorMessage: string;
  legalBasis?: string;
  consequences?: string[];
  recommendedAction?: string;
}

export interface ComplianceWarning {
  ruleId: string;
  stateCode: string;
  category: string;
  message: string;
  recommendedAction?: string;
}

export interface ContractValidationInput {
  stateCode: string;
  claimType?: 'RESIDENTIAL' | 'COMMERCIAL' | 'PERSONAL_LINES';
  feeType?: 'PERCENTAGE' | 'HOURLY' | 'FLAT_FEE' | 'CONTINGENCY';
  feePercentage?: number;
  feeAmount?: number;
  claimAmount?: number;
  isEmergency?: boolean;
  isDeclaredDisaster?: boolean;
  contractLanguage?: string;
  actionType?: 'CONTRACT' | 'SOLICITATION' | 'NEGOTIATION' | 'REPRESENTATION';
  solicitationTime?: Date;
}

/**
 * ComplianceEngine - Main validation engine
 */
export class ComplianceEngine {
  /**
   * Validate a contract against all applicable state rules
   */
  static async validateContract(input: ContractValidationInput): Promise<ComplianceValidationResult> {
    const { stateCode } = input;

    // Fetch applicable rules: state-specific OR default green zone
    const rules = await ComplianceRule.find({
      $or: [
        { stateCode: stateCode.toUpperCase() },
        { stateCode: "DEFAULT_GREEN" }
      ],
      isActive: true
    });

    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    const blockedActions: string[] = [];

    // Process each rule
    for (const rule of rules) {
      const result = await this.evaluateRule(rule, input);

      if (result.violated) {
        if (rule.severity === 'BLOCK_ACTION' || rule.severity === 'WARN_BLOCK') {
          violations.push({
            ruleId: rule._id.toString(),
            stateCode: rule.stateCode,
            category: rule.category,
            severity: rule.severity,
            errorMessage: rule.errorMessage,
            legalBasis: rule.legalBasis?.statute,
            consequences: rule.legalBasis?.consequences,
            recommendedAction: result.recommendedAction
          });

          if (rule.severity === 'BLOCK_ACTION') {
            blockedActions.push(rule.category);
          }
        } else if (rule.severity === 'WARN_CONTINUE' || rule.severity === 'INFO_ONLY') {
          warnings.push({
            ruleId: rule._id.toString(),
            stateCode: rule.stateCode,
            category: rule.category,
            message: rule.errorMessage,
            recommendedAction: result.recommendedAction
          });
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      blockedActions
    };
  }

  /**
   * Evaluate a single rule against input
   */
  private static async evaluateRule(rule: any, input: ContractValidationInput): Promise<{ violated: boolean; recommendedAction?: string }> {
    const { logicType, thresholdValue } = rule;

    switch (logicType) {
      case 'FORBIDDEN_KEYWORD':
        return this.evaluateForbiddenKeyword(rule, input);

      case 'FORBIDDEN_ACTION':
        return this.evaluateForbiddenAction(rule, input);

      case 'FORBIDDEN_FEE_TYPE':
        return this.evaluateForbiddenFeeType(rule, input);

      case 'MAX_PERCENTAGE':
        return this.evaluateMaxPercentage(rule, input);

      case 'DYNAMIC_CAP':
        return this.evaluateDynamicCap(rule, input);

      case 'SLIDING_SCALE':
        return this.evaluateSlidingScale(rule, input);

      case 'TIME_WINDOW':
        return this.evaluateTimeWindow(rule, input);

      case 'TIME_BASED_RESTRICTION':
        return this.evaluateTimeBasedRestriction(rule, input);

      case 'LANGUAGE_REQUIREMENT':
        return this.evaluateLanguageRequirement(rule, input);

      case 'REQUIRED_DISCLOSURE':
        return this.evaluateRequiredDisclosure(rule, input);

      case 'DYNAMIC_RESCISSION':
        return this.evaluateDynamicRescission(rule, input);

      default:
        return { violated: false };
    }
  }

  /**
   * FORBIDDEN_KEYWORD - Check if prohibited keywords are present
   * Used for: AL (all PA activities), AR (all PA), KS (residential), LA (percentage)
   */
  private static evaluateForbiddenKeyword(rule: any, input: ContractValidationInput) {
    const keywords = rule.thresholdValue as string[];
    const { claimType, feeType, actionType } = input;

    // Check if any forbidden keyword matches the input
    const hasViolation = keywords.some(keyword => {
      switch (keyword) {
        case 'CONTRACT':
        case 'SOLICITATION':
        case 'NEGOTIATION':
        case 'REPRESENTATION':
          return actionType === keyword;

        case 'RESIDENTIAL':
        case 'HOMEOWNER':
        case 'PERSONAL_LINES':
          return claimType === 'RESIDENTIAL' || claimType === 'PERSONAL_LINES';

        case 'PERCENTAGE':
        case 'CONTINGENCY':
          return feeType === 'PERCENTAGE' || feeType === 'CONTINGENCY';

        default:
          return false;
      }
    });

    return {
      violated: hasViolation,
      recommendedAction: this.getRecommendedAction(rule.stateCode, rule.category)
    };
  }

  /**
   * FORBIDDEN_ACTION - Complete action ban
   * Used for: Total state bans (AL, AR, AK, SD)
   */
  private static evaluateForbiddenAction(rule: any, input: ContractValidationInput) {
    // Any PA action is forbidden in these states
    return {
      violated: true,
      recommendedAction: `Refer client to licensed attorney in ${rule.stateCode}. Public adjusting is illegal in this state.`
    };
  }

  /**
   * FORBIDDEN_FEE_TYPE - Specific fee structures are illegal
   * Used for: LA (contingency fees)
   */
  private static evaluateForbiddenFeeType(rule: any, input: ContractValidationInput) {
    const forbiddenTypes = rule.thresholdValue as string[];
    const { feeType } = input;

    const violated = forbiddenTypes.includes(feeType || '');

    return {
      violated,
      recommendedAction: violated ? 'Use HOURLY or FLAT_FEE billing structure only.' : undefined
    };
  }

  /**
   * MAX_PERCENTAGE - Simple percentage cap
   * Used for: TN, MS, IL, NY, TX, IN (10-12.5% caps)
   */
  private static evaluateMaxPercentage(rule: any, input: ContractValidationInput) {
    const maxPercent = rule.thresholdValue as number;
    const { feePercentage } = input;

    if (!feePercentage) return { violated: false };

    const violated = feePercentage > maxPercent;

    return {
      violated,
      recommendedAction: violated ? `Reduce fee to ${(maxPercent * 100).toFixed(1)}% or less to comply with ${rule.stateCode} law.` : undefined
    };
  }

  /**
   * DYNAMIC_CAP - Fee cap changes based on circumstances
   * Used for: FL (20% standard / 10% emergency), NC, KY
   */
  private static evaluateDynamicCap(rule: any, input: ContractValidationInput) {
    const caps = rule.thresholdValue as { standard: number; emergency: number };
    const { feePercentage, isEmergency, isDeclaredDisaster } = input;

    if (!feePercentage) return { violated: false };

    const applicableCap = (isEmergency || isDeclaredDisaster) ? caps.emergency : caps.standard;
    const violated = feePercentage > applicableCap;

    return {
      violated,
      recommendedAction: violated
        ? `Reduce fee to ${(applicableCap * 100).toFixed(1)}% (${isEmergency ? 'emergency' : 'standard'} cap for ${rule.stateCode}).`
        : undefined
    };
  }

  /**
   * SLIDING_SCALE - Tiered fee structure
   * Used for: DE (2.5% on first $25k, 12% on excess)
   */
  private static evaluateSlidingScale(rule: any, input: ContractValidationInput) {
    const scale = rule.thresholdValue as {
      tier1_limit: number;
      tier1_percent: number;
      tier2_percent: number
    };
    const { feeAmount, claimAmount } = input;

    if (!feeAmount || !claimAmount) return { violated: false };

    // Calculate maximum allowed fee
    const tier1Amount = Math.min(claimAmount, scale.tier1_limit) * scale.tier1_percent;
    const tier2Amount = Math.max(0, claimAmount - scale.tier1_limit) * scale.tier2_percent;
    const maxAllowedFee = tier1Amount + tier2Amount;

    const violated = feeAmount > maxAllowedFee;

    return {
      violated,
      recommendedAction: violated
        ? `Maximum fee allowed: $${maxAllowedFee.toFixed(2)} (${scale.tier1_percent * 100}% on first $${scale.tier1_limit}, ${scale.tier2_percent * 100}% on excess).`
        : undefined
    };
  }

  /**
   * TIME_WINDOW - Solicitation time restrictions
   * Used for: FL (8AM - 8PM only)
   */
  private static evaluateTimeWindow(rule: any, input: ContractValidationInput) {
    const window = rule.thresholdValue as { start: string; end: string };
    const { solicitationTime, actionType } = input;

    // Only applies to solicitation actions
    if (actionType !== 'SOLICITATION' || !solicitationTime) {
      return { violated: false };
    }

    const hour = solicitationTime.getHours();
    const startHour = parseInt(window.start.split(':')[0]);
    const endHour = parseInt(window.end.split(':')[0]);

    const violated = hour < startHour || hour >= endHour;

    return {
      violated,
      recommendedAction: violated
        ? `Solicitation is only permitted between ${window.start} and ${window.end} in ${rule.stateCode}.`
        : undefined
    };
  }

  /**
   * TIME_BASED_RESTRICTION - Ban for X hours after event
   * Used for: TX (72hr), NC (48hr) post-disaster bans
   */
  private static evaluateTimeBasedRestriction(rule: any, input: ContractValidationInput) {
    const restriction = rule.thresholdValue as { restrictionHours: number; triggerEvent: string };
    const { isDeclaredDisaster, actionType } = input;

    // Only applies during declared disasters for solicitation
    if (!isDeclaredDisaster || actionType !== 'SOLICITATION') {
      return { violated: false };
    }

    // Note: In production, you'd check actual disaster declaration time
    // For now, we'll flag all solicitations during declared disasters
    return {
      violated: true,
      recommendedAction: `Wait ${restriction.restrictionHours} hours after disaster declaration before soliciting in ${rule.stateCode}.`
    };
  }

  /**
   * LANGUAGE_REQUIREMENT - Contract language requirements
   * Used for: PR (Spanish required)
   */
  private static evaluateLanguageRequirement(rule: any, input: ContractValidationInput) {
    const requiredLanguages = rule.thresholdValue as string[];
    const { contractLanguage } = input;

    if (!contractLanguage) {
      return {
        violated: true,
        recommendedAction: `Contract must be provided in ${requiredLanguages.join(' and ')} for ${rule.stateCode}.`
      };
    }

    const violated = !requiredLanguages.some(lang =>
      contractLanguage.toLowerCase().includes(lang.toLowerCase().replace('_REQUIRED', ''))
    );

    return {
      violated,
      recommendedAction: violated
        ? `Provide contract in ${requiredLanguages.join(' and ')} for ${rule.stateCode}.`
        : undefined
    };
  }

  /**
   * REQUIRED_DISCLOSURE - Mandatory contract disclosures
   * Used for: Rescission periods, cancellation rights
   */
  private static evaluateRequiredDisclosure(rule: any, input: ContractValidationInput) {
    // This is typically a WARNING_ONLY - just remind about disclosure
    return {
      violated: false, // We can't validate disclosure content here
      recommendedAction: `Ensure contract includes: ${rule.thresholdValue}`
    };
  }

  /**
   * DYNAMIC_RESCISSION - Rescission period changes based on circumstances
   * Used for: CA (3 days standard, 7 days disaster)
   */
  private static evaluateDynamicRescission(rule: any, input: ContractValidationInput) {
    const periods = rule.thresholdValue as { standard: number; emergency: number };
    const { isDeclaredDisaster } = input;

    const applicablePeriod = isDeclaredDisaster ? periods.emergency : periods.standard;

    return {
      violated: false, // WARNING_ONLY
      recommendedAction: `Include ${applicablePeriod}-day cancellation period in contract for ${rule.stateCode}.`
    };
  }

  /**
   * Get recommended action based on state and category
   */
  private static getRecommendedAction(stateCode: string, category: string): string {
    const recommendations: Record<string, Record<string, string>> = {
      'AL': {
        'LICENSE_RESTRICTION': 'Refer client to licensed Alabama attorney. Public adjusting is illegal (UPL).'
      },
      'AR': {
        'LICENSE_RESTRICTION': 'Refer client to licensed Arkansas attorney. Public adjusting is illegal.'
      },
      'KS': {
        'LICENSE_RESTRICTION': 'Kansas only permits Commercial PA. For residential claims, refer to attorney.'
      },
      'LA': {
        'FEE_STRUCTURE': 'Convert to hourly or flat fee billing. Percentage fees are illegal in Louisiana.',
        'UPL_PREVENTION': 'Do not provide coverage opinions. Stick to scope and pricing only.'
      }
    };

    return recommendations[stateCode]?.[category] || 'Contact state Department of Insurance for guidance.';
  }

  /**
   * Quick validation: Check if PA is allowed at all in a state
   */
  static async isPublicAdjustingAllowed(stateCode: string): Promise<{ allowed: boolean; reason?: string }> {
    const blockingRule = await ComplianceRule.findOne({
      stateCode: stateCode.toUpperCase(),
      category: 'LICENSE_RESTRICTION',
      severity: 'BLOCK_ACTION',
      isActive: true
    });

    if (blockingRule) {
      return {
        allowed: false,
        reason: blockingRule.errorMessage
      };
    }

    return { allowed: true };
  }

  /**
   * Get maximum allowed fee for a state
   */
  static async getMaximumFee(stateCode: string, claimAmount: number, isEmergency: boolean = false): Promise<{ maxPercentage: number; maxAmount: number; notes?: string }> {
    const feeRule = await ComplianceRule.findOne({
      stateCode: stateCode.toUpperCase(),
      category: 'FEE_CAP',
      isActive: true
    });

    if (!feeRule) {
      // Default green zone
      return {
        maxPercentage: 0.33,
        maxAmount: claimAmount * 0.33,
        notes: 'Standard reasonableness cap (no statutory limit)'
      };
    }

    let maxPercentage = 0.33; // Default

    if (feeRule.logicType === 'MAX_PERCENTAGE') {
      maxPercentage = feeRule.thresholdValue;
    } else if (feeRule.logicType === 'DYNAMIC_CAP') {
      maxPercentage = isEmergency ? feeRule.thresholdValue.emergency : feeRule.thresholdValue.standard;
    } else if (feeRule.logicType === 'SLIDING_SCALE') {
      const scale = feeRule.thresholdValue;
      const tier1 = Math.min(claimAmount, scale.tier1_limit) * scale.tier1_percent;
      const tier2 = Math.max(0, claimAmount - scale.tier1_limit) * scale.tier2_percent;
      return {
        maxPercentage: (tier1 + tier2) / claimAmount,
        maxAmount: tier1 + tier2,
        notes: `Sliding scale: ${scale.tier1_percent * 100}% up to $${scale.tier1_limit}, ${scale.tier2_percent * 100}% above`
      };
    }

    return {
      maxPercentage,
      maxAmount: claimAmount * maxPercentage,
      notes: feeRule.description
    };
  }
}

export default ComplianceEngine;
