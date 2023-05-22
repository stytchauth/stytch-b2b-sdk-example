// This API route sends a magic link to the specified email address.
import type { NextApiRequest, NextApiResponse } from 'next';
import loadStytch from '../../../lib/loadStytch';
import { getDiscoverySessionData } from '../../../lib/sessionService';

const stytchClient = loadStytch();

type ErrorData = {
  errorString: string;
};

export async function handler(req: NextApiRequest, res: NextApiResponse<ErrorData>) {
  const discoverySessionData = getDiscoverySessionData(req, res);
  if (discoverySessionData.error) {
    return res.redirect(307, '/login');
  }

  try {
    // Mark the first user in the organization as the admin
    const { organization, member } = await stytchClient.sessions.authenticate({
      session_duration_minutes: 30, // extend the session a bit
      session_jwt: discoverySessionData.sessionJWT,
    });

    await stytchClient.organizations.members.update({
      organization_id: organization.organization_id,
      member_id: member.member_id,
      trusted_metadata: { admin: true },
    });

    return res.status(200).end();
  } catch (error) {
    const errorString = JSON.stringify(error);
    return res.status(400).json({ errorString });
  }
}

export default handler;
