# Stytch B2B authentication example in Next.js

<p align="center">
  <img src="https://user-images.githubusercontent.com/100632220/220425771-fa0a92ed-3088-4ef4-8bdd-7f771bbb16bc.png" width="750">
</p>

## Overview

This example application demonstrates how one may use Stytch's B2B authentication suite within a Next.js application. The application features a sign-up and login flow powered by Email magic links. On sign-up a new organization is created, and the initial member becomes the admin of that organization. As admin, the member is able to invite others to join the organization, and set up SSO connections via SAML or OIDC.

This project utilizes Stytch's RBAC offering to enforce authorization on Stytch resources as well as custom resources.

This project utilizes Stytch's [NextJS Javascript SDK](https://www.npmjs.com/package/@stytch/nextjs) to power authentication. It uses the UI client for login flows and the headless client for member and SSO connection management after login.

This project was bootstrapped with [Create Next App](https://nextjs.org/docs/api-reference/create-next-app).

## Set up

Follow the steps below to get this application fully functional and running using your own Stytch credentials.

### In the Stytch Dashboard

1. Create a [Stytch](https://stytch.com/) account. Within the sign up flow select **B2B Authentication** as the authentication type you are interested in. Once your account is set up a Project called "My first project" will be automatically created for you.

   - If you signed up for Stytch in the past then your default Project is likely a Consumer type Project. You can confirm this in your [Project settings](https://stytch.com/dashboard/project-settings). To create a B2B project, use the Project dropdown near the top of the dashboard side nav. Be sure to select **B2B Authentication** as the authentication type.

2. Navigate to [Redirect URLs](https://stytch.com/dashboard/redirect-urls), and add `http://localhost:3000/authenticate` as the types **Login**, **Sign-up**, **Discovery**, and **Invite**.

   <img width="400" alt="Redirect URLs" src="https://user-images.githubusercontent.com/100632220/220420098-84c78ca3-4e71-46b5-90f1-25afbb571ce2.png">

3. Navigate to [Frontend SDKs](https://stytch.com/dashboard/sdk-configuration) to enable the Frontend SDK and add `http://localhost:3000` as an authorized domain & `http://localhost:3000/{{slug}}/login` as the Organization URL template. You will also need to toggle:

   1. The 'Create Organizations' setting under 'Enabled methods'. This will enable end users to create new organizations when signing up for the application.
   2. The 'Member actions & permissions' setting under 'Enabled methods'. This will allow the SDK to take various actions on behalf of the logged-in Member as long as they are permitted under the project's RBAC policy.

4. Navigate to [Roles and Permissions](https://stytch.com/dashboard/rbac) to configure the project's RBAC policy. There should already be a "stytch_member" role, which is implicitly granted to all Members, and a "stytch_admin" role.

   1. Click the "Roles" dropdown to navigate to "Resources". Click the "Create new Resource" button and create a resource with the resource ID = "todos". In the "actions" accordion, click the "Add action" button and input the following string: "create delete", which will create two actions. Make sure to save the resource before continuing.
   2. Go back to the "Roles" page. Click on the "stytch_admin" role. Click "Edit Role". Under "Permissions", click "Assign permissions". In the modal, select "todos" in the resource dropdown, then toggle the "Assign the wildcard..." switch. Click "done", then save the role.
   3. Go back to the "Roles" page. Click on the "stytch_member" role. Click "Edit Role". In the "permissions" accordion, you'll need to add permissions for 2 different resources. Once you've added both, click "done", then save the role.
      1. For the "stytch.member" resource, add the following action: "search".
      2. For the "stytch.sso" resource, add the following action: "get".
   4. Go back to the "Roles" page. Click the "Create new Role" button and create a role with the role ID = "editor". In the "permissions" accordion, you'll need to add permissions for 3 different resources. Once you've added all 3, click "done", then save the role.
      1. For the "stytch.member" resource, add the following action: "update.info.name".
      2. For the "stytch.sso" resource, add the following action: "update".
      3. For the "todos" resource, add the following action: "create".

5. Finally, navigate to [API Keys](https://stytch.com/dashboard/api-keys). You will need the `public_token` value found on this page later on.

### On your machine

In your terminal clone the project and install dependencies:

```bash
git clone https://github.com/stytchauth/stytch-b2b-sdk-example
cd stytch-b2b-sdk-example
npm i
```

Next, create an `.env.local` file by running the command below which copies the contents of `.env.template`.

```bash
cp .env.template .env.local
```

Open `.env.local` in the text editor of your choice, and set the environment variables using the `public_token` found on [API Keys](https://stytch.com/dashboard/api-keys). Leave the `NEXT_PUBLIC_STYTCH_PROJECT_ENV` value as `test`.

```
# This is what a completed .env.local file will look like
NEXT_PUBLIC_STYTCH_PROJECT_ENV=test
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=public-token-test-abc123-abcde-1234-0987-0000-abcd1234
```

## Running locally

After completing all the setup steps above the application can be run with the command:

```bash
npm run dev
```

The application will be available at [`http://localhost:3000`](http://localhost:3000).

## Expected RBAC functionality

See the [RBAC docs](https://stytch.com/docs/b2b/api/rbac-resource-object) and [guide](https://stytch.com/docs/b2b/guides/rbac/overview)
for more information on Stytch's RBAC offering.

### Resources

This example app will demonstrate how RBAC can be used for both Stytch resources and custom resources.
The Stytch resources covered by RBAC are members, organizations, and SSO connections.
The Stytch headless SDK will automatically enforce RBAC permissions on certain endpoints that affect Stytch resources,
such as member update (`stytch.organizations.member.update()`) or get SSO connections (`stytch.sso.getConnections()`).

The NextJS implementation of our Javascript SDK provides a helpful hook you can use to determine whether or not
a user can take a specified action - just call `useStytchIsAuthorized` with the specific `resource_id` and `action`.
This can be helpful when deciding what to display in the UI - for example, disabling a "save" button for updating SAML
connections if the user does not have update permissions.

The Organization TODO list in this example app is an example of using permissions on a custom resource.
Note that the TODO list does not persist state, since it doesn't actually make any API calls - it just
serves to demonstrate the usage of `useStytchIsAuthorized` with non-Stytch resources that you can define
in your RBAC policy.

### Roles and Permissions

The first member in an organization will automatically be assigned the "stytch_admin" role.
This role will allow them to invite new members to the organization, update member's names, create SSO connections,
and update SSO connections. They will also be able to create and delete items in the TODO list, which utilizes Stytch
custom resources.

Members with the "editor" role will be able to update members' names and update SSO connections,
but they will not be able to invite new members or create new SSO connections. They will be
able to add items to the TODO list, but not delete them.

All members automatically have the "stytch_member" role. Members who have only this role
will be able to view all members and SSO connections in the org, but they will not be able
to update them or create new ones. They will also not be able to create or delete items in the
TODO list.

## Get help and join the community

#### :speech_balloon: Stytch community Slack

Join the discussion, ask questions, and suggest new features in our [Slack community](https://stytch.slack.com/join/shared_invite/zt-2f0fi1ruu-ub~HGouWRmPARM1MTwPESA)!

#### :question: Need support?

Check out the [Stytch Forum](https://forum.stytch.com/) or email us at [support@stytch.com](mailto:support@stytch.com).
