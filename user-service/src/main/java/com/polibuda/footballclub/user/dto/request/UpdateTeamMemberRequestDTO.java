package com.polibuda.footballclub.user.dto.request;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.database.TeamRole;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
@Builder
public class UpdateTeamMemberRequestDTO {

    private long teamMemberId;

    private Set<TeamRole> newRoles;
    private Set<TeamRole> removedRoles;

    private TeamMemberStatus status;
}
