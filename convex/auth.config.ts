declare const process: {
  env: {
    CLERK_JWT_ISSUER_DOMAIN?: string;
  };
};

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
