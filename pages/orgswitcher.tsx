import React, {useEffect, useState} from 'react';
import {useStytchB2BClient, useStytchMember} from '@stytch/nextjs/b2b';
import {useRouter} from 'next/router';
import {Member, DiscoveredOrganization, Organization} from '@stytch/vanilla-js';

type Props = {
  discovered_organizations: DiscoveredOrganization[];
  user: Member;
};

const OrgSwitcherList = ({discovered_organizations, user}: Props) => {
  const stytch = useStytchB2BClient();
  const router = useRouter();

  const switchOrg = async (orgId: string) => {
    const data = await stytch.session.exchange({session_duration_minutes: 60, organization_id: orgId});
    router.push(`/${data.organization.organization_slug}/dashboard`);
  };

  const organizations = discovered_organizations
    .map((discovered_organization) => discovered_organization.organization)
    .filter((organization): organization is Organization => Boolean(organization));

  return (
    <div className="section">
      <h3>Your Organizations</h3>
      <ul>
        {organizations.map((organization) => (
          <li key={organization.organization_id}>
            <a onClick={() => switchOrg(organization.organization_id)}>
              <span>{organization.organization_name}</span>
              {organization.organization_id === user.organization_id && <span>&nbsp;(Active)</span>}
            </a>
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

const OrgSwitcherContainer = () => {
  const stytch = useStytchB2BClient();
  const {member, isInitialized: memberIsInitialized} = useStytchMember();
  const [discoveredOrganizations, setDiscoveredOrganizations] = useState<{
    loaded: boolean;
    discoveredOrganizations: DiscoveredOrganization[];
  }>({
    loaded: false,
    discoveredOrganizations: [],
  });

  useEffect(() => {
    stytch.discovery.organizations
      .list()
      .then((resp) =>
        setDiscoveredOrganizations({loaded: true, discoveredOrganizations: resp.discovered_organizations}),
      );
  }, [stytch, setDiscoveredOrganizations]);

  const isLoading = !memberIsInitialized || !discoveredOrganizations.loaded;
  if (isLoading) {
    return;
  }

  if (member === null) {
    return;
  }

  return <OrgSwitcher discovered_organizations={discoveredOrganizations.discoveredOrganizations} user={member}/>;
};

export default OrgSwitcherContainer;
