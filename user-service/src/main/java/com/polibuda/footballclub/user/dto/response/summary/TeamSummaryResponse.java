package com.polibuda.footballclub.user.dto.response.summary;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.database.TeamCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamSummaryResponse implements AbstractSummaryResponse {

    private Long teamId;
    private String teamName;
    private TeamCategory category;

    private TeamMemberStatus myStatus;
    
    private Integer numberOfMembers; // Opcjonalnie: licznik graczy
}