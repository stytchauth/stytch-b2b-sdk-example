import React, { FormEventHandler, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { formatSSOStartURL } from '../../../../lib/ssoUtils';
import Link from 'next/link';
import { useStytchB2BClient, useStytchIsAuthorized } from '@stytch/nextjs/b2b';
import { OIDCConnection } from '@stytch/vanilla-js';

type Props = { connection: OIDCConnection };

const OIDCConnectionEdit = ({ connection }: Props) => {
  const router = useRouter();
  const stytch = useStytchB2BClient();
  const [showPanel, setShowPanel] = useState(false);
  const togglePanel = () => setShowPanel((v) => !v);

  const onSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    try {
      await stytch.sso.oidc.updateConnection({
        connection_id: connection.connection_id,
        display_name: connection.display_name,
        client_id: data.get('client_id') as string,
        client_secret: data.get('client_secret') as string,
        issuer: data.get('issuer') as string,
        authorization_url: data.get('authorization_url') as string,
        token_url: data.get('token_url') as string,
        userinfo_url: data.get('userinfo_url') as string,
        jwks_url: data.get('jwks_url') as string,
      });
    } catch (err) {
      alert('Error updating OIDC connection');
    }

    // Force a reload to refresh the conn list
    await router.replace(router.asPath);
  };

  const { isAuthorized: canEdit } = useStytchIsAuthorized('stytch.sso', 'update');

  return (
    <>
      <div className="card">
        <form onSubmit={onSubmit} style={{ minWidth: 400 }}>
          <h1>Edit OIDC Connection</h1>
          <label htmlFor="display_name">Display Name</label>
          <input type="text" name="display_name" value={connection.display_name} disabled />
          <label htmlFor="status">Status</label>
          <input type="text" name="status" disabled value={connection.status} />
          <label htmlFor="connection_id">Connection ID</label>
          <input type="text" name="connection_id" value={connection.connection_id} disabled />
          <label htmlFor="redirect_url">Redirect URL</label>
          <input type="text" name="redirect_url" value={connection.redirect_url} disabled />
          <label htmlFor="client_id">Client ID</label>
          <input
            type="text"
            name="client_id"
            placeholder="Client ID"
            defaultValue={connection.client_id}
            disabled={!canEdit}
          />
          <label htmlFor="client_secret">Client Secret</label>
          <input
            type="text"
            name="client_secret"
            placeholder="Client Secret"
            defaultValue={connection.client_secret}
            disabled={!canEdit}
          />
          <label htmlFor="issuer">Issuer URL</label>
          <input type="text" name="issuer" placeholder="Issuer" defaultValue={connection.issuer} disabled={!canEdit} />
          <hr />
          <h5>
            If you provide a valid Issuer URL using an IDP that supports a well-known configuration page, these
            endpoints will be auto-populated.
          </h5>
          <button className="accordion" onClick={togglePanel}>
            <span>Endpoints</span>
            <span>
              <b>+</b>
            </span>
          </button>
          <div className="panel" style={{ display: showPanel ? 'block' : 'none' }}>
            <div className={'panel-contents'}>
              <label htmlFor="authorization_url">Authorization URL</label>
              <input
                type="text"
                name="authorization_url"
                placeholder="Authorization URL"
                defaultValue={connection.authorization_url}
                disabled={!canEdit}
              />
              <label htmlFor="token_url">Token URL</label>
              <input
                type="text"
                name="token_url"
                placeholder="Token URL"
                defaultValue={connection.token_url}
                disabled={!canEdit}
              />
              <label htmlFor="userinfo_url">User Info URL</label>
              <input
                type="text"
                name="userinfo_url"
                placeholder="User Info URL"
                defaultValue={connection.userinfo_url}
                disabled={!canEdit}
              />
              <label htmlFor="jwks_url">Jwks URL</label>
              <input
                type="text"
                name="jwks_url"
                placeholder="Jwks URL"
                defaultValue={connection.jwks_url}
                disabled={!canEdit}
              />
            </div>
          </div>
          {canEdit && (
            <button className="primary" type="submit">
              Save
            </button>
          )}
        </form>
        <br />
        <a style={{ minWidth: 400, margin: 10 }} onClick={() => stytch.sso.start({
          connection_id: connection.connection_id,
          login_redirect_url: `${window.location.origin}/authenticate`,
          signup_redirect_url: `${window.location.origin}/authenticate`,
        })}>
          <button className="secondary">Test connection</button>
        </a>
        <Link style={{ marginRight: 'auto' }} href={`/${router.query.slug}/dashboard`}>
          Back
        </Link>
      </div>
    </>
  );
};

const OIDCConnectionEditContainer = () => {
  const router = useRouter();
  const { connection_id } = router.query;

  const stytch = useStytchB2BClient();
  const [oidcConnection, setOIDCConnection] = useState<{ loaded: boolean; connection: OIDCConnection | null }>({
    loaded: false,
    connection: null,
  });

  const isLoading = !oidcConnection.loaded;

  useEffect(() => {
    if (!connection_id) {
      return;
    }
    stytch.sso.getConnections().then((resp) => {
      const connection = resp.oidc_connections.find((conn) => conn.connection_id === (connection_id as string)) || null;
      setOIDCConnection({ loaded: true, connection });
    });
  }, [stytch, setOIDCConnection, connection_id]);

  if (isLoading) {
    return;
  }

  if (oidcConnection.connection === null) {
    router.push('/');
    return;
  }

  return <OIDCConnectionEdit connection={oidcConnection.connection} />;
};

export default OIDCConnectionEditContainer;
