import * as stytch from 'stytch';

export const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;

const stytchEnv = process.env.NEXT_PUBLIC_STYTCH_PROJECT_ENV === 'live' ? stytch.envs.live : stytch.envs.test;

export const formatSSOStartURL = (connection_id: string): string => {
  return `${stytchEnv}/v1/public/sso/start?connection_id=${connection_id}&public_token=${publicToken}`;
};
