package com.polibuda.footballclub.user.dto.response.summary.wrappers;

import com.polibuda.footballclub.common.actions.TeamFetchMode;
import com.polibuda.footballclub.user.dto.response.summary.TeamSummaryResponse;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import lombok.NoArgsConstructor;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
// Wskazujemy: T to TeamSummaryResponse
public class TeamSearchResponse extends AbstractSearchResponse<TeamSummaryResponse> {

    // Dodatkowe pola specyficzne tylko dla szukania zespołów
    private String appliedFilterName;
    private TeamFetchMode fetchMode;
}