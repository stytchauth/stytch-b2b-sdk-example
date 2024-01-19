import { useRouter } from 'next/router';
import Link from 'next/link';
import React, { FormEventHandler, useEffect, useState } from 'react';
import { useStytchB2BClient, useStytchIsAuthorized, useStytchMember } from '@stytch/nextjs/b2b';
import { Member } from '@stytch/vanilla-js';

type Props = {
  member: Member;
  user: Member;
};

const MemberEditPage = ({ member, user }: Props) => {
  const router = useRouter();
  const stytch = useStytchB2BClient();

  const onSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const name = data.get('name') as string;

    if (canEditOtherMembers) {
      try {
        await stytch.organization.members.update({
          member_id: member.member_id,
          name: name,
        });
      } catch (err) {
        alert('Error updating member');
      }
    } else if (isSelf && canEditSelf) {
      try {
        await stytch.self.update({ name: name });
      } catch (err) {
        alert('Error updating member');
      }
    }

    // Force a reload to refresh the member object
    await router.replace(router.asPath);
  };

  const { isAuthorized: canEditOtherMembers } = useStytchIsAuthorized('stytch.member', 'update.info.name');
  const { isAuthorized: canEditSelf } = useStytchIsAuthorized('stytch.self', 'update.info.name');
  const isSelf = user.member_id === member.member_id;
  const canEdit = canEditOtherMembers || (isSelf && canEditSelf);

  return (
    <>
      <div className="card">
        <form onSubmit={onSubmit} style={{ minWidth: 400 }}>
          <h1>Edit Member</h1>
          <label htmlFor="email">Email</label>
          <input type="text" name="email" value={member.email_address} disabled />
          <label htmlFor="status">Status</label>
          <input type="text" name="status" value={member.status} disabled />
          <label htmlFor="name">Name</label>
          <input type="text" name="name" placeholder="" defaultValue={member.name} disabled={!canEdit} />
          {canEdit && (
            <button className="primary" type="submit">
              Save
            </button>
          )}
        </form>
        <br />
        <Link style={{ marginRight: 'auto' }} href={`/${router.query.slug}/dashboard`}>
          Back
        </Link>
      </div>
    </>
  );
};

const MemberEditPageContainer = () => {
  const router = useRouter();
  const { member_id } = router.query;

  const stytch = useStytchB2BClient();
  const { member, isInitialized: memberIsInitialized } = useStytchMember();
  const [memberToDisplay, setMemberToDisplay] = useState<{ loaded: boolean; member: Member | null }>({
    loaded: false,
    member: null,
  });

  const { isAuthorized: canSearchMembers } = useStytchIsAuthorized('stytch.member', 'search');

  const isLoading = !memberIsInitialized || !memberToDisplay.loaded;

  useEffect(() => {
    if (!member_id) {
      return;
    }
    const memberIdToSearch = member_id as string;
    if (canSearchMembers) {
      stytch.organization.members
        .search({
          query: { operator: 'AND', operands: [{ filter_name: 'member_ids', filter_value: [memberIdToSearch] }] },
        })
        .then((resp) =>
          setMemberToDisplay({
            member: resp.members.find((member) => member.member_id === memberIdToSearch) || null,
            loaded: true,
          }),
        );
      // if the member doesn't have permission to search other members, they can still see themself
    } else if (member !== null && member.member_id === member_id) {
      setMemberToDisplay({ loaded: true, member: member });
    }
  }, [member_id, member, canSearchMembers, stytch.organization.members]);

  if (isLoading) {
    return;
  }

  if (member === null) {
    router.push('/');
    return;
  }

  if (memberToDisplay.member === null) {
    router.push(`/${router.query.slug}/dashboard`);
    return;
  }

  return <MemberEditPage member={memberToDisplay.member} user={member} />;
};

export default MemberEditPageContainer;
