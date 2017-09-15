import getRethink from 'server/database/rethinkDriver';
import getResults from 'server/graphql/mutations/helpers/inviteTeamMembers/getResults';
import makeDetailedInvitations from 'server/graphql/mutations/helpers/inviteTeamMembers/makeDetailedInvitations';
import createPendingApprovals from 'server/safeMutations/createPendingApprovals';
import reactivateTeamMembersAndMakeNotifications from 'server/safeMutations/reactivateTeamMembersAndMakeNotifications';
import removeOrgApprovalAndNotification from 'server/safeMutations/removeOrgApprovalAndNotification';
import sendTeamInvitations from 'server/safeMutations/sendTeamInvitations';
import {isBillingLeader} from 'server/utils/authorization';
import publishNotifications from 'server/utils/publishNotifications';
import {ASK_APPROVAL, REACTIVATE, SEND_INVITATION} from 'server/utils/serverConstants';
import mergeObjectsWithArrValues from 'universal/utils/mergeObjectsWithArrValues';
import resolvePromiseObj from 'universal/utils/resolvePromiseObj';
import getPendingInvitations from 'server/safeQueries/getPendingInvitations';

const inviteTeamMembers = async (invitees, teamId, userId) => {
  const r = getRethink();
  const {name: teamName, orgId} = await r.table('Team').get(teamId).pluck('name', 'orgId');

  const emailArr = invitees.map((invitee) => invitee.email);
  const {
    inviterDoc,
    pendingInvitations,
    pendingApprovals,
    teamMembers,
    users
  } = await r.expr({
    pendingInvitations: getPendingInvitations(emailArr, teamId)('email')
      .coerceTo('array'),
    pendingApprovals: r.table('OrgApproval')
      .getAll(r.args(emailArr), {index: 'email'})
      .filter({teamId})
      .coerceTo('array'),
    teamMembers: r.table('TeamMember')
      .getAll(teamId, {index: 'teamId'})
      .coerceTo('array'),
    users: r.table('User')
      .getAll(r.args(emailArr), {index: 'email'})
      .coerceTo('array'),
    inviterDoc: r.table('User').get(userId)
      .pluck('email', 'picture', 'preferredName', 'userOrgs')
  });
  const userOrgDoc = inviterDoc.userOrgs.find((userOrg) => userOrg.id === orgId);
  const inviter = {
    userOrgs: inviterDoc.userOrgs,
    inviterAvatar: inviterDoc.picture,
    inviterEmail: inviterDoc.email,
    inviterName: inviterDoc.preferredName,
    orgId,
    teamId,
    teamName,
    userId,
    isBillingLeader: isBillingLeader(userOrgDoc)
  };

  const detailedInvitations = makeDetailedInvitations(teamMembers, emailArr, users, pendingApprovals, pendingInvitations, inviter);
  const inviteesToReactivate = detailedInvitations.filter(({action}) => action === REACTIVATE);
  const inviteesToInvite = detailedInvitations.filter(({action}) => action === SEND_INVITATION);
  const inviteesToApprove = detailedInvitations.filter(({action}) => action === ASK_APPROVAL);

  const approvalEmails = inviteesToApprove.map(({email}) => email);
  const approvalsToClear = inviteesToInvite.map(({email}) => email);

  const {reactivations, notificationsToClear, teamInvites, approvals} = await resolvePromiseObj({
    reactivations: reactivateTeamMembersAndMakeNotifications(inviteesToReactivate, inviter, teamMembers),
    notificationsToClear: removeOrgApprovalAndNotification(orgId, approvalsToClear),
    teamInvites: sendTeamInvitations(inviteesToInvite, inviter),
    approvals: createPendingApprovals(approvalEmails, inviter)
  });

  const notificationsToAdd = mergeObjectsWithArrValues(reactivations, teamInvites, approvals);
  publishNotifications({notificationsToAdd, notificationsToClear});
  const results = getResults(detailedInvitations);
  return {results};
};

export default inviteTeamMembers;