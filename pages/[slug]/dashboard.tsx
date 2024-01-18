import React, {
  FormEventHandler,
  MouseEventHandler,
  useEffect,
  useState,
} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import {useStytchB2BClient, useStytchIsAuthorized, useStytchMember, useStytchMemberSession} from '@stytch/nextjs/b2b';
import {Member, Organization, OIDCConnection, SAMLConnection} from '@stytch/vanilla-js';

type Props = {
  org: Organization;
  user: Member;
  user_roles: string[];
  members: Member[];
  saml_connections: SAMLConnection[];
  oidc_connections: OIDCConnection[];
};

const isValidEmail = (emailValue: string) => {
  // Overly simple email address regex
  const regex = /\S+@\S+\.\S+/;
  return regex.test(emailValue);
};

const getRole = (member: Member) => {
  const roleIDs = member.roles?.map((role) => role.role_id) || [];
  return getRoleFromList(roleIDs);
};

const getRoleFromList = (roles: string[]) => {
  if (roles.includes('stytch_admin')) {
    return 'admin';
  } else if (roles.includes('editor')) {
    return 'editor';
  } else {
    return 'member';
  }
};

const SSO_METHOD = {
  SAML: "SAML",
  OIDC: "OIDC",
};

const MemberRow = ({member, user}: { member: Member; user: Member }) => {
  const router = useRouter();
  const stytch = useStytchB2BClient();
  const [isDisabled, setIsDisabled] = useState(false);
  const doDelete: MouseEventHandler = async (e) => {
    e.preventDefault();
    setIsDisabled(true);
    await stytch.organization.members.delete(member.member_id);
    // Force a reload to refresh the user list
    router.replace(router.asPath);
    // TODO: Success toast?
  };

  const {isAuthorized: canDeleteMembers} = useStytchIsAuthorized('stytch.member', 'delete');

  // Do not let members delete themselves!
  const canDelete = member.member_id !== user.member_id && canDeleteMembers;

  const deleteButton = (
    <button disabled={isDisabled} onClick={doDelete}>
      Delete User
    </button>
  );

  return (
    <li>
      <Link href={`/${router.query.slug}/dashboard/members/${member.member_id}`}>
        [{getRole(member)}] {member.email_address} ({member.status})
      </Link>
      {canDelete ? deleteButton : null}
    </li>
  );
};

const MemberList = ({
                      members,
                      user,
                      org,
                    }: Pick<Props, "members" | "user" | "org">) => {
  const router = useRouter();
  const stytch = useStytchB2BClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);

  const onInviteSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    // Disable button right away to prevent sending emails twice
    if (isDisabled) {
      return;
    } else {
      setIsDisabled(true);
    }
    const rolesList = role === '' ? [] : [role];
    await stytch.magicLinks.email.invite({email_address: email, roles: rolesList});
    setEmail('');
    setRole('');
    // Force a reload to refresh the user list
    router.reload();
  };

  const roles = ['editor', 'stytch_admin'];

  const {isAuthorized: canInviteMembers} = useStytchIsAuthorized('stytch.member', 'create');

  return (
    <>
      <div className="section">
        <h2>Members</h2>
        <ul>
          {members.map((member) => (
            <MemberRow key={member.member_id} member={member} user={user}/>
          ))}
        </ul>
      </div>

      {canInviteMembers && (
        <div className="section">
          <h3>Invite new member</h3>
          <form onSubmit={onInviteSubmit} className="row">
            <input
              placeholder={`your-coworker@${
                org.email_allowed_domains[0] ?? "example.com"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <select name="role-select" id="role-select" onChange={(e) => setRole(e.target.value)}>
              <option value={role}>Set Role</option>
              {roles.map((roleId) => (
                <option key={roleId} value={roleId}>
                  {roleId}
                </option>
              ))}
            </select>
            <button className="primary" disabled={isDisabled || !isValidEmail(email)} type="submit">
              Invite
            </button>
          </form>
        </div>
      )}
    </>
  );
};

const IDPList = ({saml_connections, oidc_connections}: Pick<Props, 'saml_connections' | 'oidc_connections'>) => {
  const [idpName, setIdpName] = useState('');
  const [ssoMethod, setSsoMethod] = useState(SSO_METHOD.SAML);
  const router = useRouter();
  const stytch = useStytchB2BClient();

  const onCreate: FormEventHandler = async (e) => {
    e.preventDefault();
    if (ssoMethod === SSO_METHOD.SAML) {
      const res = await stytch.sso.saml.createConnection({display_name: idpName});
      await router.push(`/${router.query.slug}/dashboard/saml/${res.connection.connection_id}`);
    } else {
      const res = await stytch.sso.oidc.createConnection({display_name: idpName});
      await router.push(`/${router.query.slug}/dashboard/oidc/${res.connection.connection_id}`);
    }
  };

  const {isAuthorized: canCreateConnections} = useStytchIsAuthorized('stytch.sso', 'create');

  return (
    <>
      <div className="section">
        <>
          <h2>SSO Connections</h2>
          <h3>SAML</h3>
          {saml_connections.length === 0 && <p>No connections configured.</p>}
          <ul>
            {saml_connections.map((conn) => (
              <li key={conn.connection_id}>
                <Link href={`/${router.query.slug}/dashboard/saml/${conn.connection_id}`}>
                  <span>
                    {conn.display_name} ({conn.status})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <h3>OIDC</h3>
          {oidc_connections.length === 0 && <p>No connections configured.</p>}
          <ul>
            {oidc_connections.map((conn) => (
              <li key={conn.connection_id}>
                <Link href={`/${router.query.slug}/dashboard/oidc/${conn.connection_id}`}>
                  <span>
                    {conn.display_name} ({conn.status})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      </div>

      {canCreateConnections && (
        <div className="section">
          <h3>Create a new SSO Connection</h3>
          <form onSubmit={onCreate} className="row">
            <input
              type="text"
              placeholder={ssoMethod === SSO_METHOD.SAML ? `SAML Display Name` : `OIDC Display Name`}
              value={idpName}
              onChange={(e) => setIdpName(e.target.value)}
            />
            <button disabled={idpName.length < 3} type="submit" className="primary">
              Create
            </button>
          </form>
          <div className="radio-sso">
            <input
              type="radio"
              id="saml"
              name="sso_method"
              onClick={() => setSsoMethod(SSO_METHOD.SAML)}
              checked={ssoMethod === SSO_METHOD.SAML}
            />
            <label htmlFor="saml">SAML</label>
            <input
              type="radio"
              id="oidc"
              onClick={() => setSsoMethod(SSO_METHOD.OIDC)}
              checked={ssoMethod === SSO_METHOD.OIDC}
            />
            <label htmlFor="oidc">OIDC</label>
          </div>
        </div>
      )}
    </>
  );
};


const OrgTodos = () => {
  const [currentTodos, setCurrentTodos] = useState<string[]>([]);
  const [todoInput, setTodoInput] = useState<string>('');
  const submitDisabled = todoInput === '';

  const onDelete = async (itemToDelete: string) => {
    setCurrentTodos(currentTodos.filter((orgTodo) => orgTodo !== itemToDelete));
  };

  const {isAuthorized: canDelete} = useStytchIsAuthorized('todos', 'delete');
  const {isAuthorized: canCreate} = useStytchIsAuthorized('todos', 'create');

  const onSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    setCurrentTodos([...currentTodos, todoInput]);
    setTodoInput('');
  };

  return (
    <>
      <div className="section">
        <h2>Organization TODOs</h2>
        {currentTodos.length === 0 && <p>No current TODOs for your organization.</p>}
        <ul>
          {currentTodos.map((orgTodo) => (
            <li key={orgTodo}>
              {orgTodo}
              {canDelete && <button onClick={() => onDelete(orgTodo)}>Delete Item</button>}
            </li>
          ))}
        </ul>
      </div>

      {canCreate && (
        <div className="section">
          <h3>Add new TODO</h3>
          <form onSubmit={onSubmit} className="row">
            <input placeholder="" value={todoInput} onChange={(e) => setTodoInput(e.target.value)}/>
            <button disabled={submitDisabled} className="primary" type="submit">
              Save
            </button>
          </form>
        </div>
      )}
    </>
  );
};

const Dashboard = ({
                     org,
                     user,
                     user_roles,
                     members,
                     saml_connections,
                     oidc_connections,
                   }: Props) => {
  const router = useRouter();
  const stytch = useStytchB2BClient();

  const {isAuthorized: canGetSSOConnections} = useStytchIsAuthorized('stytch.sso', 'get');

  const logout = async () => {
    await stytch.session.revoke();
    router.push("/");
  };

  return (
    <div className="card">
      <h1>Organization name: {org.organization_name}</h1>
      <p>
        Organization slug: <span className="code">{org.organization_slug}</span>
      </p>
      <p>
        Current user: <span className="code">{user.email_address}</span>
      </p>
      <p>
        Current role: <span className="code">{getRoleFromList(user_roles)}</span>
      </p>
      <MemberList org={org} members={members} user={user}/>
      <br/>
      {canGetSSOConnections && (
        <>
          <IDPList saml_connections={saml_connections} oidc_connections={oidc_connections}/>
          <br/>
        </>
      )}
      <OrgTodos/>
      <div>
        <Link href={"/orgswitcher"}>Switch Organizations</Link>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <button onClick={logout}>Log Out</button>
      </div>
    </div>
  );
};

const DashboardContainer = () => {
  const stytch = useStytchB2BClient();
  const router = useRouter();
  const {member, isInitialized: memberIsInitialized} = useStytchMember();
  const {session, isInitialized: sessionIsInitialized} = useStytchMemberSession();

  // Load Organization
  const [org, setOrg] = useState<{ loaded: boolean; org: Organization | null }>({loaded: false, org: null});
  useEffect(() => {
    if(!org.loaded) {
      stytch.organization.get().then((resp) => setOrg({loaded: true, org: resp}));
    }
  }, [stytch.organization, org.loaded]);

  // Load Members
  const {isAuthorized: canSearchMembers, isInitialized} = useStytchIsAuthorized('stytch.member', 'search');
  const [members, setMembers] = useState<{ loaded: boolean; members: Member[] }>({loaded: false, members: []});
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (canSearchMembers) {
      if (!members.loaded) {
        stytch.organization.members.search({}).then((resp) => setMembers({members: resp.members, loaded: true}));
      }
    } else {
      if (member !== null) {
        setMembers({loaded: true, members: [member]});
      }
    }
  }, [canSearchMembers, isInitialized, member, members.loaded, stytch.organization.members]);

  // Load SSO Connections
  const {isAuthorized: canGetConnections} = useStytchIsAuthorized('stytch.sso', 'get');
  const [samlConnections, setSAMLConnections] = useState<{ loaded: boolean; connections: SAMLConnection[] }>({
    loaded: false,
    connections: [],
  });
  const [oidcConnections, setOIDCConnections] = useState<{ loaded: boolean; connections: OIDCConnection[] }>({
    loaded: false,
    connections: [],
  });
  useEffect(() => {
    if (canGetConnections) {
      stytch.sso.getConnections().then((resp) => {
        setSAMLConnections({loaded: true, connections: resp.saml_connections ?? []});
        setOIDCConnections({loaded: true, connections: resp.oidc_connections ?? []});
      });
    } else {
      setSAMLConnections({loaded: true, connections: []});
      setOIDCConnections({loaded: true, connections: []});
    }
  }, [canGetConnections, stytch.sso]);

  const isLoading =
    !memberIsInitialized ||
    !sessionIsInitialized ||
    !org.loaded ||
    !members.loaded ||
    !samlConnections.loaded ||
    !oidcConnections.loaded;

  if (isLoading) {
    return;
  }

  if (org.org === null || member === null || session === null) {
    router.push('/');
    return;
  }

  return (
    <Dashboard
      org={org.org}
      user={member}
      user_roles={session.roles}
      members={members.members}
      saml_connections={samlConnections.connections}
      oidc_connections={oidcConnections.connections}
    />
  );
};

export default DashboardContainer;