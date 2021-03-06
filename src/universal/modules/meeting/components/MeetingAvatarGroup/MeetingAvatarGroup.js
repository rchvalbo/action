import {css} from 'aphrodite-local-styles/no-important';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import Avatar from 'universal/components/Avatar/Avatar';
import Tag from 'universal/components/Tag/Tag';
import AsyncMenuContainer from 'universal/modules/menu/containers/AsyncMenu/AsyncMenu';
import appTheme from 'universal/styles/theme/appTheme';
import defaultUserAvatar from 'universal/styles/theme/images/avatar-user.svg';
import ui from 'universal/styles/ui';
import withStyles from 'universal/styles/withStyles';
import {CHECKIN, phaseArray, UPDATES} from 'universal/utils/constants';
import withAtmosphere from 'universal/decorators/withAtmosphere/withAtmosphere';
import RequestFacilitatorMutation from 'universal/mutations/RequestFacilitatorMutation';
import PromoteFacilitatorMutation from 'universal/mutations/PromoteFacilitatorMutation';
import {createFragmentContainer} from 'react-relay';

const originAnchor = {
  vertical: 'bottom',
  horizontal: 'right'
};

const targetAnchor = {
  vertical: 'top',
  horizontal: 'right'
};
const fetchMeetingAvatarMenu = () => System.import('universal/modules/meeting/components/MeetingAvatarMenu');

const MeetingAvatarGroup = (props) => {
  const {
    atmosphere,
    dispatch,
    gotoItem,
    isFacilitating,
    localPhase,
    localPhaseItem,
    styles,
    team: {activeFacilitator, teamId, facilitatorPhase, facilitatorPhaseItem, teamMembers}
  } = props;
  const onFacilitatorPhase = facilitatorPhase === localPhase;
  const canNavigate = localPhase === CHECKIN || localPhase === UPDATES;
  return (
    <div className={css(styles.meetingAvatarGroupRoot)}>
      <div className={css(styles.meetingAvatarGroupInner)}>
        {
          teamMembers.map((avatar, idx) => {
            const {isConnected, isSelf} = avatar;
            const picture = avatar.picture || defaultUserAvatar;
            const count = idx + 1;
            const itemStyles = css(
              styles.item,
              !canNavigate && styles.itemReadOnly
            );
            const avatarBlockStyles = css(
              styles.avatarBlock,
              count === localPhaseItem && styles.avatarBlockLocal,
              count === facilitatorPhaseItem && onFacilitatorPhase && styles.avatarBlockFacilitator,
              !canNavigate && styles.avatarBlockReadOnly
            );
            const tagBlockStyles = css(
              styles.tagBlock,
              !canNavigate && styles.tagBlockReadOnly
            );
            const navigateTo = () => {
              gotoItem(count);
            };
            const promoteToFacilitator = () => {
              PromoteFacilitatorMutation(atmosphere, {facilitatorId: avatar.id}, dispatch);
            };
            const requestFacilitator = () => {
              RequestFacilitatorMutation(atmosphere, teamId);
            };
            const avatarIsFacilitating = activeFacilitator === avatar.id;
            const handleNavigate = canNavigate && navigateTo || undefined;
            const handlePromote = isFacilitating && !isSelf && isConnected && promoteToFacilitator || undefined;
            const handleRequest = avatarIsFacilitating && !isSelf && requestFacilitator || undefined;
            const toggle = () => (
              <Avatar
                hasBadge
                isActive={avatarIsFacilitating}
                isClickable
                picture={picture}
                isConnected={avatar.isConnected || avatar.isSelf}
                isCheckedIn={avatar.isCheckedIn}
                size="fill"
              />
            );
            return (
              <div className={itemStyles} key={avatar.id}>
                <div className={avatarBlockStyles}>
                  <AsyncMenuContainer
                    fetchMenu={fetchMeetingAvatarMenu}
                    maxWidth={350}
                    maxHeight={225}
                    originAnchor={originAnchor}
                    queryVars={{
                      handleNavigate,
                      handlePromote,
                      handleRequest,
                      avatar,
                      localPhase
                    }}
                    targetAnchor={targetAnchor}
                    toggle={toggle()}
                  />
                </div>
                {avatarIsFacilitating &&
                <div className={tagBlockStyles}>
                  <Tag colorPalette="gray" label="Facilitator" />
                </div>
                }
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

MeetingAvatarGroup.propTypes = {
  atmosphere: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  gotoItem: PropTypes.func.isRequired,
  isFacilitating: PropTypes.bool,
  localPhase: PropTypes.oneOf(phaseArray),
  localPhaseItem: PropTypes.number,
  styles: PropTypes.object,
  team: PropTypes.object.isRequired
};

const borderDefault = appTheme.palette.mid20a;
const borderWarm = appTheme.palette.warm80a;
const borderLocal = appTheme.palette.dark;
const boxShadowBase = '0 0 0 3px #fff, 0 0 0 7px';
const boxShadowBorder = `${boxShadowBase} ${borderDefault}`;
const boxShadowWarm = `${boxShadowBase} ${borderWarm}`;
const boxShadowLocal = `${boxShadowBase} ${borderLocal}`;

const styleThunk = () => ({
  meetingAvatarGroupRoot: {
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: '1rem 0'
  },

  meetingAvatarGroupInner: {
    display: 'flex',
    position: 'relative',
    textAlign: 'center'
  },

  item: {
    marginLeft: '1.25rem',
    marginRight: '.4375rem',
    position: 'relative'
  },

  avatarBlock: {
    borderRadius: '100%',
    boxShadow: boxShadowBorder,
    width: '2.25rem',

    [ui.breakpoint.wide]: {
      width: '2.5rem'
    },
    [ui.breakpoint.wider]: {
      width: '3rem'
    },
    [ui.breakpoint.widest]: {
      width: '4rem'
    },

    ':hover': {
      opacity: '.5'
    }
  },

  avatarBlockLocal: {
    boxShadow: boxShadowLocal
  },

  avatarBlockFacilitator: {
    boxShadow: boxShadowWarm
  },

  itemReadOnly: {
    // marginRight: 0,
  },

  avatarBlockReadOnly: {
    boxShadow: ui.avatarDefaultBoxShadow,

    ':hover': {
      opacity: '1'
    }
  },

  tagBlock: {
    bottom: '-1.75rem',
    left: '50%',
    paddingRight: ui.tagGutter,
    position: 'absolute',
    transform: 'translateX(-50%)'
  },

  tagBlockReadOnly: {
    // bottom: '-1.3125rem'
  }
});

export default createFragmentContainer(
  connect()(withAtmosphere(withStyles(styleThunk)(MeetingAvatarGroup))),
  graphql`
    fragment MeetingAvatarGroup_team on Team {
      teamId: id
      activeFacilitator
      facilitatorPhase
      facilitatorPhaseItem
      teamMembers(sortBy: "checkInOrder") {
        id
        isCheckedIn
        isConnected
        isSelf
        picture
        ...MeetingAvatarMenu_avatar
      }
    }`
);
