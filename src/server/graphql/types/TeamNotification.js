import {GraphQLID, GraphQLInterfaceType} from 'graphql';
import NotificationEnum from 'server/graphql/types/NotificationEnum';
import NotifyAddedToTeam from 'server/graphql/types/NotifyAddedToTeam';
import NotifyDenial from 'server/graphql/types/NotifyDenial';
import NotifyInviteeApproved from 'server/graphql/types/NotifyInviteeApproved';
import NotifyKickedOut from 'server/graphql/types/NotifyKickedOut';
import NotifyNewTeamMember from 'server/graphql/types/NotifyNewTeamMember';
import NotifyProjectInvolves from 'server/graphql/types/NotifyProjectInvolves';
import NotifyRequestNewUser from 'server/graphql/types/NotifyRequestNewUser';
import NotifyTeamArchived from 'server/graphql/types/NotifyTeamArchived';
import NotifyTeamInvite from 'server/graphql/types/NotifyTeamInvite';
import {
  ADD_TO_TEAM,
  DENY_NEW_USER,
  INVITEE_APPROVED,
  JOIN_TEAM,
  KICKED_OUT,
  PROJECT_INVOLVES,
  REJOIN_TEAM,
  REQUEST_NEW_USER,
  TEAM_ARCHIVED,
  TEAM_INVITE
} from 'universal/utils/constants';

const TeamNotification = new GraphQLInterfaceType({
  name: 'TeamNotification',
  fields: {
    id: {
      type: GraphQLID
    },
    type: {
      type: NotificationEnum
    }
  },
  resolveType({type}) {
    const resolveTypeLookup = {
      [ADD_TO_TEAM]: NotifyAddedToTeam,
      [DENY_NEW_USER]: NotifyDenial,
      [INVITEE_APPROVED]: NotifyInviteeApproved,
      [JOIN_TEAM]: NotifyNewTeamMember,
      [KICKED_OUT]: NotifyKickedOut,
      [PROJECT_INVOLVES]: NotifyProjectInvolves,
      [REJOIN_TEAM]: NotifyNewTeamMember,
      [REQUEST_NEW_USER]: NotifyRequestNewUser,
      [TEAM_INVITE]: NotifyTeamInvite,
      [TEAM_ARCHIVED]: NotifyTeamArchived
    };

    return resolveTypeLookup[type];
  }
});

export default TeamNotification;
