export const backendCapabilities = {
  developer: {
    webhooks: false,
    standaloneDocs: false,
  },
  loyalty: {
    manualAdjustments: false,
    enrollment: false,
    tierManagement: false,
  },
  gst: {
    filing: false,
    hsnMappings: false,
  },
  marketIntelligence: {
    competitors: false,
    forecasts: false,
    recommendations: false,
  },
  finance: {
    kycSubmission: true,
    loanApplications: true,
  },
  purchaseOrders: {
    draftEditing: false,
    confirmation: false,
    pdfGeneration: false,
    emailDelivery: false,
  },
  whatsapp: {
    arbitraryMessaging: false,
    templateCreation: false,
    campaigns: false,
    optInManagement: false,
    testMessages: false,
  },
} as const;
