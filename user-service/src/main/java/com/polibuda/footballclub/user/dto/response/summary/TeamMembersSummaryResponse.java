package com.polibuda.footballclub.user.dto.response.summary;

import com.polibuda.footballclub.user.dto.response.restricted.MemberProfileResponse;
import com.polibuda.footballclub.user.dto.response.restricted.TeamMemberListItemDto;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.AbstractSearchResponse;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TeamMembersSummaryResponse extends AbstractSearchResponse<TeamMemberListItemDto> {

    private MemberSummaryResponse member;

}