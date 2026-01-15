package com.polibuda.footballclub.match.dto.fromMatchService;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchTeamDto {
    private Long teamId;
    private String teamName;
    private String category;
    private List<MatchMemberDto> members;
}