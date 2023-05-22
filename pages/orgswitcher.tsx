import React from 'react';
import loadStytch, { Member, DiscoveredOrganizations } from '../lib/loadStytch';
import { getDiscoverySessionData, useAuth, withSession } from '../lib/sessionService';
import { useStytchB2BClient } from '@stytch/nextjs/b2b';
import { useRouter } from 'next/router';

type Props = {
  discovered_organizations: DiscoveredOrganizations;
  user: Member;
};

const OrgSwitcherList = ({ discovered_organizations, user }: Props) => {
  const stytch = useStytchB2BClient();
  const router = useRouter();

  const switchOrg = async (orgId: string) => {
    const data = await stytch.session.exchange({ session_duration_minutes: 60, organization_id: orgId });
    router.push(`/${data.organization.organization_slug}/dashboard`);
  };
  return (
    <div className="section">
      <h3>Your Organizations</h3>
      <ul>
        {discovered_organizations.map(({ organization }) => (
          <li key={organization.organization_id} onClick={() => switchOrg(organization.organization_id)}>
            <span>{organization.organization_name}</span>
            {organization.organization_id === user.organization_id && <span>&nbsp;(Active)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

const OrgSwitcher = (props: Props) => {
  return (
    <div className="card">
      <OrgSwitcherList {...props} />
    </div>
  );
};

export const getServerSideProps = withSession<Props>(async (context) => {
  const { member } = useAuth(context);
  const discoverySessionData = getDiscoverySessionData(context.req, context.res);
  if (discoverySessionData.error) {
    return { redirect: { statusCode: 307, destination: `/login` } };
  }

  const { discovered_organizations } = await loadStytch().discovery.organizations.list({
    intermediate_session_token: discoverySessionData.intermediateSession,
    session_jwt: discoverySessionData.sessionJWT,
  });

  return {
    props: {
      user: member,
      discovered_organizations,
    },
  };
});

export default OrgSwitcher;
