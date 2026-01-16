package com.polibuda.footballclub.user.dto.request;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.claims.FieldPosition;
import com.polibuda.footballclub.common.database.TeamRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManageTeamMemberRequest {

    // ID relacji (team_member_id), a nie ID usera!
    @NotNull(message = "ID członka zespołu jest wymagane")
    private Long teamMemberId;

    @NotNull(message = "Status jest wymagany")
    private TeamMemberStatus status;

    private FieldPosition newFieldPosition;
    // Opcjonalne: przy okazji zmiany statusu można nadać role
    private Set<TeamRole> newRoles;
    private Set<TeamRole> removedRoles;
    private Integer number;
}