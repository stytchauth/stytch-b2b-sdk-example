import React, { useEffect, useState } from "react";
import { StytchB2B } from "@stytch/nextjs/b2b";
import {
  AuthFlowType,
  B2BOAuthProviders,
  B2BProducts,
  StytchB2BUIConfig,
} from "@stytch/vanilla-js";

const LoginOrSignupDiscoveryForm = () => {
  const [config, setConfig] = useState<StytchB2BUIConfig | null>();

  useEffect(() => {
    setConfig({
      products: [B2BProducts.emailMagicLinks, B2BProducts.oauth],
      sessionOptions: { sessionDurationMinutes: 60 },
      emailMagicLinksOptions: {
        // window.location.origin is not defined on SSR - we need to wait for CSR to render
        discoveryRedirectURL: `${window.location.origin}/authenticate`,
      },
      oauthOptions: {
        providers: [{ type: B2BOAuthProviders.Google, one_tap: true }],
        // window.location.origin is not defined on SSR - we need to wait for CSR to render
        discoveryRedirectURL: `${window.location.origin}/authenticate`,
      },
      authFlowType: AuthFlowType.Discovery,
    });
  }, []);

  return config ? <StytchB2B config={config} /> : null;
};

export default LoginOrSignupDiscoveryForm;
