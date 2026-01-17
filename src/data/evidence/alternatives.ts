// Evidence schema for tool alternatives
// All sources use INTERNAL paths (e.g., "/tool/fliki/pricing") not external URLs

export type EvidenceSource = {
  url: string; // INTERNAL path, e.g. "/tool/fliki/pricing"
  facts: string[];
};

export type EvidenceClaim = {
  claim: string;
  sources: EvidenceSource[];
};

export type ToolAlternativeEvidence = {
  tool: string;
  bestFor: string[];
  whySwitch: EvidenceClaim[]; // exactly 2
  tradeoffs: EvidenceClaim[]; // exactly 1
  pricingSignals: {
    freePlan?: EvidenceClaim;
    watermark?: EvidenceClaim;
    exportQuality?: EvidenceClaim;
    refundCancel?: EvidenceClaim;
  };
};

// Evidence data keyed by tool slug
export const alternativesEvidence: Record<string, ToolAlternativeEvidence> = {
  fliki: {
    tool: "fliki",
    bestFor: [
      "Bloggers repurposing written content into videos",
      "Content marketers needing high-volume video production",
      "Faceless YouTubers creating explainer videos"
    ],
    whySwitch: [
      {
        claim: "Fliki offers faster text-to-video conversion with better AI voice quality than InVideo",
        sources: [
          {
            url: "/tool/fliki/pricing",
            facts: [
              "900+ AI voices in 75+ languages with ultra-realistic quality",
              "Blog-to-video feature automatically converts entire blog posts",
              "Faster workflow: text-based editing like a Google Doc"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Limited AI voice options compared to Fliki",
              "More complex editing interface requiring more manual work",
              "Credits consumed on edits and regenerations"
            ]
          }
        ]
      },
      {
        claim: "Fliki provides better value for high-volume creators with more generous free plan and clearer pricing",
        sources: [
          {
            url: "/tool/fliki/pricing",
            facts: [
              "Free plan: 5 minutes/month, 720p exports with watermark",
              "Standard plan: $21/month for 180 minutes/month",
              "14-day money-back guarantee clearly stated"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: 10 minutes/week with watermarks",
              "Plus plan: $28/month with credit consumption on edits",
              "Refund/cancellation process reported as difficult"
            ]
          }
        ]
      }
    ],
    tradeoffs: [
      {
        claim: "Fliki has more limited stock video library and editing controls compared to InVideo",
        sources: [
          {
            url: "/tool/fliki/pricing",
            facts: [
              "Limited media library compared to InVideo's premium stock sources",
              "Less granular editing control (text-based vs timeline-based)",
              "50 scene limit on free plan"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Access to iStock, Storyblocks, Shutterstock premium libraries",
              "More advanced editing features for frame-level control",
              "Unlimited exports on paid plans"
            ]
          }
        ]
      }
    ],
    pricingSignals: {
      freePlan: {
        claim: "Fliki free plan offers 5 minutes/month with watermark, better for testing than InVideo's weekly limits",
        sources: [
          {
            url: "/tool/fliki/pricing",
            facts: [
              "5 minutes of credits per month",
              "720p video resolution",
              "Contains Fliki watermark",
              "50 scene limits"
            ]
          }
        ]
      },
      watermark: {
        claim: "Both tools include watermarks on free plans, but Fliki offers clearer upgrade path",
        sources: [
          {
            url: "/tool/fliki/pricing",
            facts: [
              "Free plan: Contains Fliki watermark",
              "Standard plan ($21/mo): Watermark removal"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: Visible watermarks (brand + stock media watermarks)",
              "Plus plan ($28/mo): Watermark removal"
            ]
          }
        ]
      },
      exportQuality: {
        claim: "Fliki free plan exports at 720p, while InVideo offers up to 1080p on free (varies by account)",
        sources: [
          {
            url: "/tool/fliki/pricing",
            facts: [
              "Free plan: 720p video resolution",
              "Standard plan: 1080p exports"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: Up to 1080p (varies by account, older docs mention 720p)",
              "Export quality consistent across plans"
            ]
          }
        ]
      },
      refundCancel: {
        claim: "Fliki offers 14-day money-back guarantee, while InVideo refund process is reported as difficult",
        sources: [
          {
            url: "/tool/fliki/pricing",
            facts: [
              "14-day money-back guarantee for paid plans",
              "Clear refund policy stated"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Refund/cancellation process reported as frustrating",
              "Annual charges difficult to reverse per user reports"
            ]
          }
        ]
      }
    }
  },
  "veed-io": {
    tool: "veed-io",
    bestFor: [
      "Social Media Creators & Beginners",
      "Content Creators",
      "Social Media Managers"
    ],
    whySwitch: [
      {
        claim: "Veed.io offers easier video editing with excellent auto-subtitle feature, better suited for beginners than InVideo",
        sources: [
          {
            url: "/tool/veed-io/pricing",
            facts: [
              "Very easy to use",
              "Excellent auto-subtitle feature",
              "No software download needed",
              "Web-based editor accessible on any device"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "More complex editing interface requiring more manual work",
              "[NEED VERIFICATION: subtitle feature comparison]"
            ]
          }
        ]
      },
      {
        claim: "Veed.io provides better value with lower starting price and generous free plan compared to InVideo",
        sources: [
          {
            url: "/tool/veed-io/pricing",
            facts: [
              "Free plan: 2GB storage, 720p export, 2 min/mo auto subtitles",
              "Lite plan: $12/month (yearly) or $24/month (monthly)",
              "Starting price: $12/mo"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: 10 minutes/week with watermarks",
              "Plus plan: $28/month",
              "Starting price: $28/mo"
            ]
          }
        ]
      }
    ],
    tradeoffs: [
      {
        claim: "Veed.io has limited advanced editing features and watermark on free plan compared to InVideo's premium stock libraries",
        sources: [
          {
            url: "/tool/veed-io/pricing",
            facts: [
              "Limited advanced editing features",
              "Watermark on free plan",
              "Limited stock audio & video on free plan"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Access to iStock, Storyblocks, Shutterstock premium libraries",
              "[NEED VERIFICATION: advanced editing features comparison]"
            ]
          }
        ]
      }
    ],
    pricingSignals: {
      freePlan: {
        claim: "Veed.io free plan offers 2GB storage and 720p exports with watermark, suitable for basic editing",
        sources: [
          {
            url: "/tool/veed-io/pricing",
            facts: [
              "2GB storage",
              "720p export quality",
              "2 min/mo auto subtitles",
              "Limited stock audio & video"
            ]
          }
        ]
      },
      watermark: {
        claim: "Both tools include watermarks on free plans, Veed.io removes watermark on Lite plan ($12/mo yearly)",
        sources: [
          {
            url: "/tool/veed-io/pricing",
            facts: [
              "Free plan: Watermark present",
              "Lite plan: Remove watermark feature"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: Visible watermarks (brand + stock media watermarks)",
              "Plus plan ($28/mo): Watermark removal"
            ]
          }
        ]
      },
      exportQuality: {
        claim: "Veed.io free plan exports at 720p, Lite plan offers 1080p, Pro plan offers 4k",
        sources: [
          {
            url: "/tool/veed-io/pricing",
            facts: [
              "Free plan: 720p export quality",
              "Lite plan: Full HD 1080p Exports",
              "Pro plan: Export quality: 4k"
            ]
          }
        ]
      },
      refundCancel: {
        claim: "[NEED VERIFICATION: Veed.io refund and cancellation policy]",
        sources: [
          {
            url: "/tool/veed-io/pricing",
            facts: [
              "[NEED VERIFICATION: refund policy not explicitly stated in pricing data]"
            ]
          }
        ]
      }
    }
  },
  "heygen": {
    tool: "heygen",
    bestFor: [
      "Sales Outreach & L&D Teams",
      "Educators"
    ],
    whySwitch: [
      {
        claim: "HeyGen specializes in ultra-realistic AI avatars with excellent lip-sync, better for avatar-focused content than InVideo",
        sources: [
          {
            url: "/tool/heygen/pricing",
            facts: [
              "Ultra-realistic lip-sync technology",
              "High quality avatars",
              "Easy interface, no technical skills needed",
              "500+ Stock Video Avatars on free plan",
              "1 Custom Video Avatar on free plan"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "[NEED VERIFICATION: avatar quality comparison]",
              "Focus on prompt-to-video workflow rather than avatars"
            ]
          }
        ]
      },
      {
        claim: "HeyGen offers competitive pricing with free plan (3 videos/month) and lower starting price than InVideo",
        sources: [
          {
            url: "/tool/heygen/pricing",
            facts: [
              "Free plan: 3 videos per month, 720p export, videos up to 3-mins",
              "Creator plan: $29/month (monthly) or $24/month (yearly)",
              "Starting price: $29/mo"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: 10 minutes/week with watermarks",
              "Plus plan: $28/month",
              "Starting price: $28/mo"
            ]
          }
        ]
      }
    ],
    tradeoffs: [
      {
        claim: "HeyGen is expensive for high usage and credit system can be confusing, while InVideo offers more video generation minutes",
        sources: [
          {
            url: "/tool/heygen/pricing",
            facts: [
              "Expensive for high usage",
              "Credit system can be confusing",
              "Free plan: Only 3 videos per month"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "[NEED VERIFICATION: video generation minutes comparison]",
              "Free plan: 10 minutes/week"
            ]
          }
        ]
      }
    ],
    pricingSignals: {
      freePlan: {
        claim: "HeyGen free plan offers 3 videos per month, 720p export, videos up to 3-mins",
        sources: [
          {
            url: "/tool/heygen/pricing",
            facts: [
              "3 videos per month",
              "Videos up to 3-mins",
              "720p video export",
              "1 Custom Video Avatar",
              "500+ Stock Video Avatars"
            ]
          }
        ]
      },
      watermark: {
        claim: "[NEED VERIFICATION: HeyGen free plan watermark status]",
        sources: [
          {
            url: "/tool/heygen/pricing",
            facts: [
              "[NEED VERIFICATION: watermark information not explicitly stated in pricing data]"
            ]
          }
        ]
      },
      exportQuality: {
        claim: "HeyGen free plan exports at 720p, Creator plan offers 1080p, Team plan offers 4k",
        sources: [
          {
            url: "/tool/heygen/pricing",
            facts: [
              "Free plan: 720p video export",
              "Creator plan: 1080p video export",
              "Team plan: 4k video export"
            ]
          }
        ]
      },
      refundCancel: {
        claim: "[NEED VERIFICATION: HeyGen refund and cancellation policy]",
        sources: [
          {
            url: "/tool/heygen/pricing",
            facts: [
              "[NEED VERIFICATION: refund policy not explicitly stated in pricing data]"
            ]
          }
        ]
      }
    }
  },
  "synthesia": {
    tool: "synthesia",
    bestFor: [
      "Corporate Training & Enterprise",
      "Educators",
      "Enterprise Teams"
    ],
    whySwitch: [
      {
        claim: "Synthesia offers enterprise-grade security and quality with 140+ AI avatars, better for corporate use than InVideo",
        sources: [
          {
            url: "/tool/synthesia/pricing",
            facts: [
              "Enterprise grade quality and security",
              "SOC 2 compliant",
              "140+ AI Avatars",
              "120+ Languages support",
              "Widely used by Fortune 500 companies"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "[NEED VERIFICATION: enterprise security features comparison]",
              "Focus on prompt-to-video workflow rather than enterprise features"
            ]
          }
        ]
      },
      {
        claim: "Synthesia provides better multilingual support (120+ languages) and enterprise features compared to InVideo",
        sources: [
          {
            url: "/tool/synthesia/pricing",
            facts: [
              "Multilingual support for 120+ languages",
              "1-Click Translations into 80+ languages on Enterprise plan",
              "Enterprise security features",
              "Live team collaboration on Enterprise plan"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "[NEED VERIFICATION: language support comparison]",
              "[NEED VERIFICATION: enterprise collaboration features]"
            ]
          }
        ]
      }
    ],
    tradeoffs: [
      {
        claim: "Synthesia has no free plan (only demo) and can feel slightly robotic, while InVideo offers free plan with watermarks",
        sources: [
          {
            url: "/tool/synthesia/pricing",
            facts: [
              "No free plan (only demo)",
              "Can feel slightly robotic compared to HeyGen",
              "Basic plan: Free but includes Synthesia logo (not fully free)"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: 10 minutes/week with watermarks",
              "[NEED VERIFICATION: avatar quality comparison]"
            ]
          }
        ]
      }
    ],
    pricingSignals: {
      freePlan: {
        claim: "Synthesia Basic plan is free but includes Synthesia logo, usable for up to 3 minutes of video/month",
        sources: [
          {
            url: "/tool/synthesia/pricing",
            facts: [
              "Basic plan: Free",
              "Includes 360 credits/mo",
              "Usable for up to 3 minutes of video/month (36 minutes/year)",
              "9 AI Avatars",
              "Includes Synthesia logo (Remove Synthesia logo on Starter plan)"
            ]
          }
        ]
      },
      watermark: {
        claim: "Synthesia Basic plan includes logo, Starter plan ($29/mo) removes Synthesia logo",
        sources: [
          {
            url: "/tool/synthesia/pricing",
            facts: [
              "Basic plan: Includes Synthesia logo",
              "Starter plan: Remove Synthesia logo feature"
            ]
          }
        ]
      },
      exportQuality: {
        claim: "[NEED VERIFICATION: Synthesia export quality by plan]",
        sources: [
          {
            url: "/tool/synthesia/pricing",
            facts: [
              "[NEED VERIFICATION: export quality not explicitly stated in pricing data]"
            ]
          }
        ]
      },
      refundCancel: {
        claim: "[NEED VERIFICATION: Synthesia refund and cancellation policy]",
        sources: [
          {
            url: "/tool/synthesia/pricing",
            facts: [
              "[NEED VERIFICATION: refund policy not explicitly stated in pricing data]"
            ]
          }
        ]
      }
    }
  },
  "pictory": {
    tool: "pictory",
    bestFor: [
      "Content Repurposing (Webinars/Zoom)",
      "Content Creators"
    ],
    whySwitch: [
      {
        claim: "Pictory specializes in content repurposing with auto-highlight feature, better for repurposing long-form content than InVideo",
        sources: [
          {
            url: "/tool/pictory/pricing",
            facts: [
              "Great for repurposing long-form content",
              "Auto Highlight feature",
              "Edit Video using Text feature",
              "Blog to Video feature",
              "Auto Captions"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "[NEED VERIFICATION: content repurposing features comparison]",
              "Focus on prompt-to-video workflow"
            ]
          }
        ]
      },
      {
        claim: "Pictory offers lower starting price ($19/mo) and better free trial (3 videos) compared to InVideo",
        sources: [
          {
            url: "/tool/pictory/pricing",
            facts: [
              "Free plan: 15 min total, 720p export, Watermark",
              "Starter plan: $19/mo for 200 min/mo, 1080p export, No watermark",
              "Starting price: $19/mo"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: 10 minutes/week with watermarks",
              "Plus plan: $28/month",
              "Starting price: $28/mo"
            ]
          }
        ]
      }
    ],
    tradeoffs: [
      {
        claim: "Pictory AI voice quality varies and stock footage can be generic, while InVideo offers premium stock libraries",
        sources: [
          {
            url: "/tool/pictory/pricing",
            facts: [
              "AI voice quality varies",
              "Stock footage can be generic"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Access to iStock, Storyblocks, Shutterstock premium libraries",
              "[NEED VERIFICATION: AI voice quality comparison]"
            ]
          }
        ]
      }
    ],
    pricingSignals: {
      freePlan: {
        claim: "Pictory free plan offers 15 min total, 720p export, with watermark",
        sources: [
          {
            url: "/tool/pictory/pricing",
            facts: [
              "15 min total",
              "720p export",
              "Watermark",
              "Basic features"
            ]
          }
        ]
      },
      watermark: {
        claim: "Pictory free plan includes watermark, Starter plan ($19/mo) removes watermark",
        sources: [
          {
            url: "/tool/pictory/pricing",
            facts: [
              "Free plan: Watermark",
              "Starter plan: No watermark"
            ]
          },
          {
            url: "/tool/invideo/pricing",
            facts: [
              "Free plan: Visible watermarks (brand + stock media watermarks)",
              "Plus plan ($28/mo): Watermark removal"
            ]
          }
        ]
      },
      exportQuality: {
        claim: "Pictory free plan exports at 720p, Starter plan offers 1080p export",
        sources: [
          {
            url: "/tool/pictory/pricing",
            facts: [
              "Free plan: 720p export",
              "Starter plan: 1080p export"
            ]
          }
        ]
      },
      refundCancel: {
        claim: "[NEED VERIFICATION: Pictory refund and cancellation policy]",
        sources: [
          {
            url: "/tool/pictory/pricing",
            facts: [
              "[NEED VERIFICATION: refund policy not explicitly stated in pricing data]"
            ]
          }
        ]
      }
    }
  }
};
