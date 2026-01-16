package com.polibuda.footballclub.match.dto.response.wrappers;

import com.polibuda.footballclub.match.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponseDTO {
    // Sekcja 1: Dane meczu
    private Long matchId;
    private LocalDateTime matchDate;
    private MatchStatus status;
    private Long homeTeamScore;
    private Long awayTeamScore;

    // Sekcja 2: Wrappery drużyn
    private MatchTeamDataDTO homeTeam;
    private MatchTeamDataDTO awayTeam;
}