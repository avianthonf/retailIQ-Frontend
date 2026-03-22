export const backendCapabilities = {
  developer: {
    webhooks: true,
    standaloneDocs: false,
  },
  loyalty: {
    manualAdjustments: true,
    enrollment: true,
    tierManagement: true,
  },
  gst: {
    filing: true,
    hsnMappings: true,
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
    draftEditing: true,
    confirmation: true,
    pdfGeneration: true,
    emailDelivery: true,
  },
  whatsapp: {
    arbitraryMessaging: true,
    templateCreation: true,
    campaigns: true,
    optInManagement: true,
    testMessages: true,
  },
} as const;
