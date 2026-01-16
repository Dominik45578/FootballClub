package com.polibuda.footballclub.match.mappers;

import com.polibuda.footballclub.match.dto.fromMatchService.MatchMemberDto;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.response.PlayerResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchTeamDataDTO;
import com.polibuda.footballclub.match.entity.Match;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class MatchMapper {

    /**
     * Główna metoda mapująca.
     * Łączy dane z bazy (Match) + dane z User Service (internalTeam) + dane z Football Data (externalTeam).
     */
    public MatchResponseDTO toDto(Match match, MatchTeamDto internalTeam, TeamDetailsResponseDTO externalTeam) {
        
        // 1. Przygotuj wrappery dla obu zespołów
        MatchTeamDataDTO internalTeamWrapper = mapInternalTeam(internalTeam);
        MatchTeamDataDTO externalTeamWrapper = mapExternalTeam(externalTeam);

        // 2. Ustal kto jest gospodarzem na podstawie flagi w bazie
        MatchTeamDataDTO homeTeam;
        MatchTeamDataDTO awayTeam;
        Long awayTeamScore;
        Long homeTeamScore;

        if (Boolean.TRUE.equals(match.getIsInternalTeamHome())) {
            homeTeam = internalTeamWrapper;
            awayTeam = externalTeamWrapper;
            homeTeamScore = match.getInternalTeamScore();
            awayTeamScore = match.getExternalTeamScore();
        } else {
            homeTeam = externalTeamWrapper;
            awayTeam = internalTeamWrapper;
            homeTeamScore = match.getExternalTeamScore();
            awayTeamScore = match.getInternalTeamScore();
        }

        // 3. Zbuduj odpowiedź
        return MatchResponseDTO.builder()
                .matchId(match.getId())
                .matchDate(match.getMatchDate())
                .status(match.getStatus())
                .homeTeam(homeTeam)
                .awayTeam(awayTeam)
                .homeTeamScore(homeTeamScore)
                .awayTeamScore(awayTeamScore)
                .build();
    }

    // --- Private Helpers ---

    private MatchTeamDataDTO mapInternalTeam(MatchTeamDto source) {
        if (source == null) {
            return MatchTeamDataDTO.builder()
                    .id(0L)
                    .name("Unknown Internal Team")
                    .isInternal(true)
                    .build();
        }
        return MatchTeamDataDTO.builder()
                .id(source.getTeamId())
                .name(source.getTeamName())
                .isInternal(true)
                .squad(source.getMembers() != null ? source.getMembers() : Collections.emptyList())
                .build();
    }

    private MatchTeamDataDTO mapExternalTeam(TeamDetailsResponseDTO source) {
        if (source == null) {
            return MatchTeamDataDTO.builder()
                    .id(0L)
                    .name("Unknown External Team")
                    .isInternal(false)
                    .build();
        }
        return MatchTeamDataDTO.builder()
                .id(source.getTeamInfo().getId())
                .name(source.getTeamInfo().getName())
                .isInternal(false)
                .squad(source.getSquad().stream().map(this::mapMatchTeam).collect(Collectors.toList()))
                .build();
    }

    private MatchMemberDto mapMatchTeam(PlayerResponseDTO source) {
        return MatchMemberDto.builder()
                .memberId(source.getId())
                .firstName(source.getName())
                .fieldPosition(source.getPosition())
                .number(source.getNumber())
                .build();
    }
}