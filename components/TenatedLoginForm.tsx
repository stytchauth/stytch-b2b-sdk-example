import React, { useEffect, useState } from "react";
import { StytchB2B } from "@stytch/nextjs/b2b";
import {
  AuthFlowType,
  B2BProducts,
  StytchB2BUIConfig,
} from "@stytch/vanilla-js";

const TenantedLoginForm = () => {
  const [config, setConfig] = useState<StytchB2BUIConfig | null>();

  useEffect(() => {
    setConfig({
      products: [B2BProducts.emailMagicLinks],
      sessionOptions: { sessionDurationMinutes: 60 },
      emailMagicLinksOptions: {
        loginRedirectURL: `${window.location.origin}/authenticate`,
        signupRedirectURL: `${window.location.origin}/authenticate`,
      },
      authFlowType: AuthFlowType.Organization,
    });
  }, []);

  return config ? <StytchB2B config={config} /> : null;
};

export default TenantedLoginForm;
