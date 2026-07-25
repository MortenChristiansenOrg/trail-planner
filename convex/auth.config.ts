import type { AuthConfig } from "convex/server";

declare const process: {
  env: {
    CLERK_JWT_ISSUER_DOMAIN?: string;
    CONVEX_CLOUD_URL?: string;
  };
};

const previewClerkIssuerDomain =
  "https://prepared-shad-64.clerk.accounts.dev";
const catalogPrPreviewDeployment =
  "https://shocking-albatross-785.eu-west-1.convex.cloud";
const deploymentUrl = process.env.CONVEX_CLOUD_URL;
const isLocalDeployment =
  deploymentUrl?.startsWith("http://127.0.0.1:") ||
  deploymentUrl?.startsWith("http://localhost:");

// This PR's fresh Convex preview has no per-deployment environment variables.
// Keep its public test issuer scoped to that backend (and local development);
// every other deployment must configure its own issuer explicitly.
const clerkJwtIssuerDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ??
  (deploymentUrl === catalogPrPreviewDeployment || isLocalDeployment
    ? previewClerkIssuerDomain
    : undefined);

if (!clerkJwtIssuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN must be configured for this Convex deployment",
  );
}

export default {
  providers: [
    {
      domain: clerkJwtIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
