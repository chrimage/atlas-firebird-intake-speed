/**
 * Application Configuration
 * 
 * Customize these values for your deployment
 */

export const CONFIG = {
  // Company/Organization Information
  company: {
    name: "Your Company Name", 
    tagline: "Professional Services - Get in touch with us",
    shortName: "Company", // Used in email subjects
    emoji: "🔥", // Used throughout the UI
  },

  // Contact Form Configuration
  contactForm: {
    title: "Contact Us",
    submitButtonText: "Send Message 🚀",
    responseTimeMessage: "We'll get back to you within 24 hours",
    
    // Available service types in the dropdown
    serviceTypes: [
      "General Inquiry",
      "Technical Support",
      "Sales Question", 
      "Partnership Opportunity",
      "Customer Service",
      "Billing Question",
      "Feature Request",
      "Bug Report",
      "Other"
    ],
    
    // Form validation messages
    validation: {
      nameRequired: "Name is required",
      serviceTypeRequired: "Please select a service type", 
      messageRequired: "Message is required",
      emailInvalid: "Please enter a valid email address"
    }
  },

  // Email Configuration
  email: {
    subjectPrefix: "New Contact Form", // Will become "New Contact Form: [Service Type] - [Name]"
    systemName: "Contact Form System", // Used as sender name
    
    // Email templates
    templates: {
      adminNotification: {
        header: "New Contact Form Submission",
        footer: "Reply directly to this email to contact the customer."
      }
    }
  },

  // Admin Panel Configuration  
  admin: {
    title: "Admin Panel",
    welcomeMessage: "Contact Form Administration",
    
    // Status options for submissions
    statusOptions: [
      { value: "new", label: "New", color: "#e67e22" },
      { value: "in_progress", label: "In Progress", color: "#3498db" },
      { value: "resolved", label: "Resolved", color: "#27ae60" },
      { value: "cancelled", label: "Cancelled", color: "#e74c3c" }
    ],
    
    // Table column headers
    columns: {
      name: "Name",
      email: "Email", 
      phone: "Phone",
      service: "Service",
      message: "Message",
      status: "Status",
      date: "Date"
    },
    
    // Empty state message
    emptyState: {
      title: "No submissions yet",
      message: "Waiting for the first contact form submission...",
      buttonText: "Test Contact Form"
    }
  },

  // UI Styling Configuration
  styling: {
    // Teal-Gold color scheme with dark teal dominant
    colors: {
      // Teal palette (dominant)
      primary: "#0f766e", // Dark teal
      primaryHover: "#0d5452", // Darker teal for hover
      primaryLight: "#14b8a6", // Lighter teal
      primaryBg: "#134e4a", // Very dark teal for backgrounds
      
      // Gold palette (accent)
      accent: "#fbbf24", // Gold accent
      accentHover: "#f59e0b", // Darker gold hover
      accentLight: "#fde68a", // Light gold
      accentDark: "#d97706", // Dark gold
      
      // Status colors with teal-gold theme
      success: "#059669", // Emerald green (teal family)
      successHover: "#047857",
      error: "#dc2626", // Red
      errorBg: "#fef2f2",
      warning: "#d97706", // Amber (gold family)
      warningBg: "#fffbeb",
      
      // Text colors
      text: "#134e4a", // Dark teal text
      textLight: "#6b7280", // Gray text
      textInverse: "#ffffff", // White text for dark backgrounds
      
      // Background colors
      background: "#f0fdfa", // Very light teal background
      backgroundSecondary: "#ecfdf5", // Light emerald background
      backgroundDark: "#134e4a", // Dark teal background
      
      // Surface colors
      surface: "#ffffff", // White surface
      surfaceTeal: "#f0fdfa", // Light teal surface
      surfaceGold: "#fffbeb", // Light gold surface
      
      // Border colors
      border: "#94a3b8", // Gray border
      borderTeal: "#5eead4", // Teal border
      borderGold: "#fde68a", // Gold border
      
      // Gradients
      gradientPrimary: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", // Teal gradient
      gradientAccent: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)", // Gold gradient
      gradientDark: "linear-gradient(135deg, #134e4a 0%, #0f766e 100%)", // Dark teal gradient
      gradientTealGold: "linear-gradient(135deg, #0f766e 0%, #fbbf24 100%)", // Teal to gold
      
      // Shadow colors
      shadowTeal: "rgba(15, 118, 110, 0.15)",
      shadowGold: "rgba(251, 191, 36, 0.15)",
      shadowDark: "rgba(19, 78, 74, 0.25)"
    },
    
    // Typography
    fonts: {
      primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    
    // Visual effects
    effects: {
      borderRadius: "8px",
      borderRadiusLarge: "12px",
      borderRadiusSmall: "4px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      boxShadowLarge: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: "all 0.2s ease-in-out"
    }
  },

  // Security Configuration
  security: {
    // Email addresses allowed to access admin panel (if not using Cloudflare Access)
    allowedAdminEmails: [
      "admin@yourdomain.com",
      "manager@yourdomain.com"
      // Add more admin emails as needed
    ],
    
    // CORS configuration
    cors: {
      allowedOrigins: ["*"], // In production, specify your domains
      allowedMethods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"]
    }
  },

  // Feature Flags
  features: {
    enableEmailNotifications: true,
    enableAdminAuth: true, // Set to false to disable admin email checking
    enableCloudflareAccess: true, // Set to false if not using Cloudflare Access
    enableAnalytics: true,
    enablePhoneField: true,
    enablePriorityField: false // Future feature
  },

  // Environment-specific overrides
  environments: {
    development: {
      company: {
        name: "Your Company Name (DEV)"
      },
      features: {
        enableEmailNotifications: false // Disable emails in dev
      }
    },
    staging: {
      company: {
        name: "Your Company Name (STAGING)"
      }
    }
  }
};

/**
 * Get configuration with environment-specific overrides applied
 */
export function getConfig(environment: string = "production"): typeof CONFIG {
  const baseConfig = { ...CONFIG };
  
  if (environment !== "production" && CONFIG.environments[environment as keyof typeof CONFIG.environments]) {
    const envOverrides = CONFIG.environments[environment as keyof typeof CONFIG.environments];
    return mergeConfig(baseConfig, envOverrides);
  }
  
  return baseConfig;
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(base: any, overrides: any): any {
  const result = { ...base };
  
  for (const key in overrides) {
    if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
      result[key] = mergeConfig(base[key] || {}, overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  
  return result;
}

/**
 * Validate configuration on startup
 */
export function validateConfig(config: typeof CONFIG): string[] {
  const errors: string[] = [];
  
  if (!config.company.name || config.company.name === "Your Company Name") {
    errors.push("Please update CONFIG.company.name in src/config.ts");
  }
  
  if (config.contactForm.serviceTypes.length === 0) {
    errors.push("At least one service type must be configured");
  }
  
  if (config.security.allowedAdminEmails.some(email => email.includes("yourdomain.com"))) {
    errors.push("Please update admin email addresses in CONFIG.security.allowedAdminEmails");
  }
  
  return errors;
}