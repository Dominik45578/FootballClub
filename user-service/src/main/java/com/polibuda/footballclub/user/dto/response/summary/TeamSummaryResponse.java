package com.polibuda.footballclub.user.dto.response.summary;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.database.TeamCategory;
import com.polibuda.footballclub.common.database.TeamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamSummaryResponse implements AbstractSummaryResponse {

    private Long teamId;
    private String teamName;
    private TeamCategory category;
    private TeamStatus status;
    private Integer numberOfMembers; // Opcjonalnie: licznik graczy
    private Instant createdAt;
    private String description;
}