import { z } from "zod";

export const CompanyOverviewSchema = z.object({
  ticker: z.string(),
  exchange: z.string(),
  companyName: z.string(),
  reportDate: z.string().describe("ISO date string"),
  currentPrice: z.number(),
  fiftyTwoWeekHigh: z.number(),
  fiftyTwoWeekLow: z.number(),
  marketCapGBPm: z.number(),
  sharesOutstandingM: z.number(),
  trailingPE: z.number(),
  forwardPE: z.number(),
  dcfFairValue: z.number(),
  dividendYieldPct: z.number(),
  consensusPriceTarget: z.number(),
  analystCount: z.number(),
  weekPerformancePct: z.number().optional(),
  beta: z.number().optional(),
  eps_trailing: z.number().optional()
});

export const ShareholderStructureSchema = z.object({
  ticker: z.string(),
  freeFloatPct: z.number(),
  institutionalHoldingsPct: z.number(),
  managementHoldingsPct: z.number(),
  totalSharesM: z.number(),
  topInstitutionalHolders: z.array(z.object({
    name: z.string(),
    holdingPct: z.number(),
    sharesM: z.number().optional(),
    changeQoQ: z.number().optional()
  })),
  recentInsiderTransactions: z.array(z.object({
    date: z.string(),
    insiderName: z.string(),
    role: z.string(),
    transactionType: z.enum(["BUY", "SELL", "GRANT", "EXERCISE"]),
    shares: z.number(),
    pricePerShare: z.number().optional(),
    totalValue: z.number().optional(),
    notes: z.string().optional()
  }))
});

export const AnalystRecommendationsSchema = z.object({
  ticker: z.string(),
  consensusRating: z.enum(["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]),
  averagePriceTarget: z.number(),
  medianPriceTarget: z.number(),
  highPriceTarget: z.number(),
  lowPriceTarget: z.number(),
  totalAnalysts: z.number(),
  ratingBreakdown: z.object({
    strongBuy: z.number(),
    buy: z.number(),
    hold: z.number(),
    sell: z.number(),
    strongSell: z.number()
  }),
  recentRatings: z.array(z.object({
    firm: z.string(),
    analyst: z.string().optional(),
    rating: z.string(),
    priceTarget: z.number(),
    date: z.string(),
    note: z.string().optional()
  })),
  impliedUpsidePct: z.number()
});

export const DCFValuationSchema = z.object({
  ticker: z.string(),
  wacc: z.number(),
  terminalGrowthRate: z.number(),
  beta: z.number(),
  riskFreeRate: z.number(),
  equityRiskPremium: z.number(),
  forecastPeriodYears: z.number(),
  projectedRevenueCagr: z.number(),
  pvOfFCFm: z.number(),
  pvOfTerminalValuem: z.number(),
  enterpriseValuem: z.number(),
  netDebtCashm: z.number(),
  equityValuem: z.number(),
  sharesForValuationM: z.number(),
  fairValuePerShare: z.number(),
  currentPrice: z.number(),
  impliedUpsidePct: z.number(),
  sensitivityTable: z.array(z.object({
    wacc: z.number(),
    terminalGrowthRate: z.number(),
    fairValue: z.number()
  })).optional()
});

export const FinancialStatementsSchema = z.object({
  ticker: z.string(),
  incomeStatement: z.array(z.object({
    fiscalYear: z.string(),
    revenueM: z.number(),
    revenueGrowthPct: z.number().optional(),
    operatingIncomeM: z.number(),
    netIncomeM: z.number(),
    dilutedEPS: z.number(),
    pbtMarginPct: z.number().optional()
  })),
  balanceSheet: z.array(z.object({
    fiscalYear: z.string(),
    cashM: z.number(),
    totalAssetsM: z.number(),
    totalDebtM: z.number(),
    shareholdersEquityM: z.number(),
    debtToEquity: z.number()
  })),
  cashFlow: z.array(z.object({
    fiscalYear: z.string(),
    operatingCFm: z.number(),
    capexM: z.number(),
    freeCFm: z.number(),
    fcfMarginPct: z.number(),
    dividendsPaidM: z.number(),
    buybacksM: z.number().optional()
  })),
  keyRatios: z.array(z.object({
    fiscalYear: z.string(),
    pe: z.number().optional(),
    peg: z.number().optional(),
    evRevenue: z.number().optional(),
    evEbitda: z.number().optional(),
    debtEquity: z.number().optional(),
    interestCoverage: z.number().optional(),
    currentRatio: z.number().optional(),
    roe: z.number().optional(),
    roic: z.number().optional()
  }))
});

export const BusinessSegmentsSchema = z.object({
  ticker: z.string(),
  revenueBreakdown: z.array(z.object({
    stream: z.string(),
    amountM: z.number(),
    pctOfTotal: z.number(),
    yoyGrowthPct: z.number().optional(),
    driver: z.string().optional()
  })),
  platformSegments: z.array(z.object({
    segment: z.string(),
    customers: z.number().optional(),
    auaBn: z.number().optional(),
    auaGrowthPct: z.number().optional(),
    netInflowsBn: z.number().optional(),
    comments: z.string().optional()
  })),
  competitors: z.array(z.object({
    name: z.string(),
    auaBn: z.number().optional(),
    marketCapM: z.number().optional(),
    keyStrengths: z.string().optional(),
    keyWeaknesses: z.string().optional()
  })),
  competitiveAdvantages: z.array(z.string())
});

export const RecentResultsSchema = z.object({
  ticker: z.string(),
  period: z.string(),
  revenueM: z.number(),
  revenueGrowthPct: z.number(),
  pbtM: z.number(),
  pbtGrowthPct: z.number(),
  pbtMarginPct: z.number(),
  netIncomeM: z.number(),
  dilutedEPS: z.number(),
  operatingCFm: z.number(),
  fcfM: z.number(),
  keyPositives: z.array(z.string()),
  keyNegatives: z.array(z.string()),
  managementGuidance: z.object({
    revenueGrowthGuidancePct: z.number().optional(),
    marginGuidancePct: z.number().optional(),
    keyComments: z.array(z.string())
  }),
  analystConsensusFY26E: z.object({
    revenueM: z.number().optional(),
    pbtM: z.number().optional(),
    eps: z.number().optional(),
    dividendPerShare: z.number().optional()
  }).optional()
});

export const RegulatoryRisksSchema = z.object({
  ticker: z.string(),
  contingentLiabilities: z.array(z.object({
    item: z.string(),
    estimatedAnnualCostM: z.number().optional(),
    status: z.string(),
    riskLevel: z.enum(["LOW", "LOW_MEDIUM", "MEDIUM", "HIGH"]),
    impact: z.string()
  })),
  regulatoryFramework: z.array(z.object({
    regulator: z.string(),
    status: z.string(),
    notes: z.string().optional()
  })),
  netContingentPositionNote: z.string().optional()
});

export const NewsCatalystsSchema = z.object({
  ticker: z.string(),
  companyNews: z.array(z.object({
    date: z.string(),
    headline: z.string(),
    summary: z.string(),
    sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
    sourceUrl: z.string().optional()
  })),
  industryNews: z.array(z.object({
    date: z.string(),
    headline: z.string(),
    summary: z.string(),
    impactOnCompany: z.string().optional(),
    sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"])
  })),
  upsideCatalysts: z.array(z.string()),
  downsideCatalysts: z.array(z.string())
});

export const ShareholderCommunicationsSchema = z.object({
  ticker: z.string(),
  latestStatementDate: z.string(),
  chairName: z.string().optional(),
  ceoName: z.string().optional(),
  positiveThemes: z.array(z.string()),
  cautionaryThemes: z.array(z.string()),
  historicalPositives: z.array(z.string()),
  historicalNegatives: z.array(z.string())
});

export const ForwardProjectionsSchema = z.object({
  ticker: z.string(),
  projectedIncomeStatement: z.array(z.object({
    year: z.string(),
    revenueM: z.number(),
    yoyGrowthPct: z.number(),
    adminExpensesM: z.number().optional(),
    operatingIncomeM: z.number(),
    opMarginPct: z.number(),
    pbtM: z.number(),
    pbtMarginPct: z.number(),
    netIncomeM: z.number(),
    netMarginPct: z.number(),
    dilutedSharesM: z.number(),
    dilutedEPS: z.number(),
    epsGrowthPct: z.number().optional()
  })),
  projectedBalanceSheet: z.array(z.object({
    year: z.string(),
    cashM: z.number(),
    totalAssetsM: z.number(),
    totalDebtM: z.number(),
    shareholdersEquityM: z.number(),
    debtToEquity: z.number(),
    currentRatio: z.number()
  })),
  projectedCashFlow: z.array(z.object({
    year: z.string(),
    operatingCFm: z.number(),
    capexM: z.number(),
    freeCFm: z.number(),
    fcfMarginPct: z.number(),
    dividendsPaidM: z.number(),
    buybacksM: z.number().optional(),
    totalShareholderReturnsM: z.number().optional()
  })),
  projectedCreditMetrics: z.array(z.object({
    year: z.string(),
    netDebtEbitda: z.number(),
    interestCoverage: z.number(),
    debtCapitalizationPct: z.number(),
    impliedCreditRating: z.string().optional()
  })).optional(),
  keyAssumptions: z.object({
    revenueCagrPct: z.number(),
    terminalPbtMarginPct: z.number(),
    effectiveTaxRatePct: z.number(),
    annualBuybackM: z.number().optional(),
    shareCountReductionAnnualPct: z.number().optional()
  })
});

export const ValuationSummarySchema = z.object({
  ticker: z.string(),
  baseCaseFairValue: z.number(),
  bullCaseFairValue: z.number(),
  bearCaseFairValue: z.number(),
  currentPrice: z.number(),
  twelveMonthPriceTarget: z.number(),
  recommendation: z.enum(["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]),
  impliedUpsidePct: z.number(),
  priceTargetRationale: z.array(z.string()),
  entryStrategy: z.object({
    aggressive: z.string(),
    conservative: z.string(),
    dcaApproach: z.string().optional()
  })
});

export const AGMSchema = z.object({
  ticker: z.string(),
  agmDate: z.string(),
  agmLocation: z.string().optional(),
  noticeFiledDate: z.string().optional(),
  resolutions: z.array(z.object({
    number: z.number(),
    title: z.string(),
    type: z.enum(["ORDINARY", "SPECIAL", "ADVISORY"]),
    expectedResult: z.string()
  })),
  keyGovernanceNotes: z.array(z.string()),
  dividendDetails: z.object({
    latestDps: z.number(),
    exDividendDate: z.string().optional(),
    paymentDate: z.string().optional(),
    coverRatio: z.number().optional(),
    consecutiveYearsOfGrowth: z.number().optional()
  }).optional()
});

export const SECTION_SCHEMAS = {
  companyOverview: CompanyOverviewSchema,
  shareholderStructure: ShareholderStructureSchema,
  analystRecommendations: AnalystRecommendationsSchema,
  dcfValuation: DCFValuationSchema,
  financialStatements: FinancialStatementsSchema,
  businessSegments: BusinessSegmentsSchema,
  recentResults: RecentResultsSchema,
  regulatoryRisks: RegulatoryRisksSchema,
  newsCatalysts: NewsCatalystsSchema,
  shareholderCommunications: ShareholderCommunicationsSchema,
  forwardProjections: ForwardProjectionsSchema,
  valuationSummary: ValuationSummarySchema,
  agm: AGMSchema
};

export const SECTION_KEYS = Object.keys(SECTION_SCHEMAS);
