import React, { FormEventHandler, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { formatSSOStartURL } from '../../../../lib/ssoUtils';
import Link from 'next/link';
import { useStytchB2BClient, useStytchIsAuthorized } from '@stytch/nextjs/b2b';
import { SAMLConnection } from '@stytch/vanilla-js';

type Props = { connection: SAMLConnection };

const SAMLConnectionEdit = ({ connection }: Props) => {
  const router = useRouter();
  const stytch = useStytchB2BClient();

  const onSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    try {
      await stytch.sso.saml.updateConnection({
        x509_certificate: data.get('certificate') as string,
        connection_id: connection.connection_id,
        display_name: connection.display_name,
        attribute_mapping: {
          email: data.get('email_attribute') as string,
          first_name: data.get('first_name_attribute') as string,
          last_name: data.get('last_name_attribute') as string,
        },
        idp_entity_id: data.get('idp_entity_id') as string,
        idp_sso_url: data.get('idp_sso_url') as string,
      });
    } catch (err) {
      alert('Error updating SAML connection');
    }

    // Force a reload to refresh the conn list
    await router.replace(router.asPath);
  };

  const { isAuthorized: canEdit } = useStytchIsAuthorized('stytch.sso', 'update');

  return (
    <>
      <div className="card">
        <form onSubmit={onSubmit} style={{ minWidth: 400 }}>
          <h1>Edit SAML Connection</h1>
          <label htmlFor="display_name">Display Name</label>
          <input type="text" name="display_name" value={connection.display_name} disabled />
          <label htmlFor="status">Status</label>
          <input type="text" name="status" disabled value={connection.status} />
          <label htmlFor="acs_url">ACS URL</label>
          <input type="text" name="acs_url" disabled value={connection.acs_url} />
          <label htmlFor="audience_uri">Audience URI</label>
          <input type="text" name="audience_uri" disabled value={connection.audience_uri} />
          <label htmlFor="idp_sso_url">SSO URL</label>
          <input
            type="text"
            name="idp_sso_url"
            placeholder="https://idp.com/sso/start"
            defaultValue={connection.idp_sso_url}
            disabled={!canEdit}
          />
          <label htmlFor="idp_entity_id">IDP Entity ID</label>
          <input
            type="text"
            name="idp_entity_id"
            placeholder="https://idp.com/sso/start"
            defaultValue={connection.idp_entity_id}
            disabled={!canEdit}
          />
          <label htmlFor="email_attribute">Email Attribute</label>
          <input
            type="text"
            name="email_attribute"
            placeholder="NameID"
            defaultValue={connection.attribute_mapping ? connection.attribute_mapping['email'] : ''}
            disabled={!canEdit}
          />
          <label htmlFor="first_name_attribute">First Name Attribute</label>
          <input
            type="text"
            name="first_name_attribute"
            placeholder="firstName"
            defaultValue={connection.attribute_mapping ? connection.attribute_mapping['first_name'] : ''}
            disabled={!canEdit}
          />
          <label htmlFor="last_name_attribute">Last Name Attribute</label>
          <input
            type="text"
            name="last_name_attribute"
            placeholder="lastName"
            defaultValue={connection.attribute_mapping ? connection.attribute_mapping['last_name'] : ''}
            disabled={!canEdit}
          />
          <label htmlFor="certificate">Signing Certificate</label>
          <textarea
            name="certificate"
            placeholder="-------BEGIN ------"
            defaultValue={connection.verification_certificates[0]?.certificate}
            disabled={!canEdit}
          />
          {canEdit && (
            <button className="primary" type="submit">
              Save
            </button>
          )}
        </form>
        <br />
        <a style={{ minWidth: 400, margin: 10 }} href={formatSSOStartURL(connection.connection_id)}>
          <button className="secondary">Test connection</button>
        </a>
        <Link style={{ marginRight: 'auto' }} href={`/${router.query.slug}/dashboard`}>
          Back
        </Link>
      </div>
    </>
  );
};

const SAMLConnectionEditContainer = () => {
  const router = useRouter();
  const { connection_id } = router.query;

  const stytch = useStytchB2BClient();
  const [samlConnection, setSAMLConnection] = useState<{ loaded: boolean; connection: SAMLConnection | null }>({
    loaded: false,
    connection: null,
  });

  const isLoading = !samlConnection.loaded;

  useEffect(() => {
    if (!connection_id) {
      return;
    }
    stytch.sso.getConnections().then((resp) => {
      const connection = resp.saml_connections.find((conn) => conn.connection_id === (connection_id as string)) || null;
      setSAMLConnection({ loaded: true, connection });
    });
  }, [connection_id, stytch.sso]);

  if (isLoading) {
    return;
  }

  if (samlConnection.connection === null) {
    router.push('/');
    return;
  }

  return <SAMLConnectionEdit connection={samlConnection.connection} />;
};

export default SAMLConnectionEditContainer;
