package com.polibuda.footballclub.match.mappers;

import com.polibuda.footballclub.match.dto.fromMatchService.MatchMemberDto;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.response.PlayerResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchTeamDataDTO;
import com.polibuda.footballclub.match.entity.Match;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class MatchMapper {

    public MatchResponseDTO toDto(Match match, MatchTeamDto internalTeam, TeamDetailsResponseDTO externalTeam) {

        // 1. Mapowanie wrapperów zespołów
        MatchTeamDataDTO internalTeamWrapper = mapInternalTeam(internalTeam);
        MatchTeamDataDTO externalTeamWrapper = mapExternalTeam(externalTeam);

        // 2. Logika gospodarza (Home/Away)
        MatchTeamDataDTO homeTeam;
        MatchTeamDataDTO awayTeam;
        Long homeTeamScore;
        Long awayTeamScore;

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
        // UWAGA: MatchTeamDto aktualnie nie posiada pola logoUrl w swojej strukturze.
        // Jeśli chcesz je mieć dla internal team, musisz dodać je do MatchTeamDto
        // oraz uzupełnić MatchProtoMapper.
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

        // FIX: Dodano mapowanie logoUrl
        String logoUrl = source.getTeamInfo() != null ? source.getTeamInfo().getLogoUrl() : null;

        return MatchTeamDataDTO.builder()
                .id(source.getTeamInfo().getId())
                .name(source.getTeamInfo().getName())
                .isInternal(false)
                .logoUrl(logoUrl) // Tutaj następuje przypisanie brakującego pola
                .squad(source.getSquad().stream().map(this::mapMatchTeam).collect(Collectors.toList()))
                .build();
    }

    private MatchMemberDto mapMatchTeam(PlayerResponseDTO source) {
        return MatchMemberDto.builder()
                .memberId(source.getId())
                .firstName(source.getName())
                .fieldPosition(source.getPosition())
                .number(source.getNumber())
                .logoUrl(source.getPhotoUrl())
                .build();
    }
}