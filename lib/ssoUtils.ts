export const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;

const stytchEnv = process.env.NEXT_PUBLIC_STYTCH_PROJECT_ENV === 'live' ?
  "https://api.stytch.com/v1/" :
  "https://test.stytch.com/v1/";

export const formatSSOStartURL = (connection_id: string): string => {
  return `${stytchEnv}/public/sso/start?connection_id=${connection_id}&public_token=${publicToken}`;
};
