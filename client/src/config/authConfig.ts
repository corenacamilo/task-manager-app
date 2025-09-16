import { Configuration, PopupRequest } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || "your_client_id_here",
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || "your_tenant_id_here"}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI || "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: [
    "User.Read",
    "Calendars.ReadWrite",
    "Mail.Send"
  ]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphCalendarEndpoint: "https://graph.microsoft.com/v1.0/me/events"
};
