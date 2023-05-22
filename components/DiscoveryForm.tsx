import React, { useEffect, useState } from "react";
import { StytchB2B } from "@stytch/nextjs/b2b";
import {
  AuthFlowType,
  B2BProducts,
  StytchB2BUIConfig,
} from "@stytch/vanilla-js";

const LoginOrSignupDiscoveryForm = () => {
  const [config, setConfig] = useState<StytchB2BUIConfig | null>();

  useEffect(() => {
    setConfig({
      products: [B2BProducts.emailMagicLinks],
      sessionOptions: { sessionDurationMinutes: 60 },
      emailMagicLinksOptions: {
        discoveryRedirectURL: `${window.location.origin}/authenticate`,
      },
      authFlowType: AuthFlowType.Discovery,
    });
  }, []);

  return config ? <StytchB2B config={config} /> : null;
};

export default LoginOrSignupDiscoveryForm;
