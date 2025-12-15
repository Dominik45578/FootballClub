package com.polibuda.footballclub.user.dto.response.restricted;

import com.polibuda.footballclub.common.database.TeamCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamDetailsResponse {

    private Long id;
    private String name;
    private String code; // Kod widoczny tylko dla członków (żeby mogli zapraszać kolegów)
    private TeamCategory category;
    private Instant createdAt;
    
    // Lista członków wewnątrz szczegółów zespołu
    private List<TeamMemberListItemDto> members;
}