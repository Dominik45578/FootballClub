package com.polibuda.footballclub.user.dto.response.summary.wrappers;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.user.dto.response.restricted.TeamMemberListItemDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TeamMemberSearchResponse extends AbstractSearchResponse<TeamMemberListItemDto> {
    TeamMemberStatus status;
}
