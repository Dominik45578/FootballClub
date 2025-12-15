package com.polibuda.footballclub.user.dto.response.restricted;


import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.database.TeamRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberListItemDto {

    private Long teamMemberId;
    private Long memberId;
    private String firstName;
    private String lastName;
    private Set<TeamRole> roles;
    private TeamMemberStatus status;
}