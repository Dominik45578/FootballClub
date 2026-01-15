package com.polibuda.footballclub.match.mappers;

import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchTeamDataDTO;
import com.polibuda.footballclub.match.entity.Match;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class MatchMapper {

    /**
     * Główna metoda mapująca.
     * Łączy dane z bazy (Match) + dane z User Service (internalTeam) + dane z Football Data (externalTeam).
     */
    public MatchResponseDTO toDto(Match match, MatchTeamDto internalTeam, TeamBasicResponseDTO externalTeam) {
        
        // 1. Przygotuj wrappery dla obu zespołów
        MatchTeamDataDTO internalTeamWrapper = mapInternalTeam(internalTeam);
        MatchTeamDataDTO externalTeamWrapper = mapExternalTeam(externalTeam);

        // 2. Ustal kto jest gospodarzem na podstawie flagi w bazie
        MatchTeamDataDTO homeTeam;
        MatchTeamDataDTO awayTeam;

        if (Boolean.TRUE.equals(match.getIsInternalTeamHome())) {
            homeTeam = internalTeamWrapper;
            awayTeam = externalTeamWrapper;
        } else {
            homeTeam = externalTeamWrapper;
            awayTeam = internalTeamWrapper;
        }

        // 3. Zbuduj odpowiedź
        return MatchResponseDTO.builder()
                .matchId(match.getId())
                .matchDate(match.getMatchDate())
                .status(match.getStatus())
                .homeTeam(homeTeam)
                .awayTeam(awayTeam)
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
                // Przepisujemy skład pobrany z gRPC
                .squad(source.getMembers() != null ? source.getMembers() : Collections.emptyList())
                .build();
    }

    private MatchTeamDataDTO mapExternalTeam(TeamBasicResponseDTO source) {
        if (source == null) {
            return MatchTeamDataDTO.builder()
                    .id(0L)
                    .name("Unknown External Team")
                    .isInternal(false)
                    .build();
        }
        return MatchTeamDataDTO.builder()
                .id(source.getId())
                .name(source.getName())
                .isInternal(false)
                // Dla zespołów zewnętrznych (basic info) skład może być pusty
                // lub dociągany w osobnej metodzie jeśli będzie potrzebny
                .squad(Collections.emptyList()) 
                .build();
    }
}