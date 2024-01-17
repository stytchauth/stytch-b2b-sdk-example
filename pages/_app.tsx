import "../styles/stytch.css";
import type { AppProps } from "next/app";
import { StytchB2BProvider } from "@stytch/nextjs/b2b";
import { createStytchB2BUIClient } from '@stytch/nextjs/b2b/ui';
import React from "react";
import Head from "next/head";

const stytch = createStytchB2BUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN ?? "",
  {
    cookieOptions: {
      jwtCookieName: `stytch_session_jwt_next_b2b_app`,
      opaqueTokenCookieName: `stytch_session_next_b2b_app`,
    },
  }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Stytch Next.js B2B Example</title>
        <meta
          name="description"
          content="An example Next.js B2B application using Stytch for authentication"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <StytchB2BProvider stytch={stytch}>
        <main>
          <div className="container">
            <Component {...pageProps} />
          </div>
        </main>
      </StytchB2BProvider>
    </>
  );
}
export default MyApp;
