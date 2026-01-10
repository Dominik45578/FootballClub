package com.polibuda.footballclub.football_external_data;

import com.polibuda.footballclub.football_external_data.dto.clubs.TeamSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.dto.clubs.VenueSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.dto.squads.PlayerDataDTO;
import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.entity.VenueEntity;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@Component
public class FootballDataMapper {

    public TeamEntity mapToTeamEntity(TeamSummaryDataDTO dto) {
        return TeamEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .code(dto.getCode())
                .country(dto.getCountry())
                .founded(dto.getFounded())
                .national(dto.isNational())
                .logoUrl(dto.getLogoUrl())
                .venues(new HashSet<>()) // Inicjalizacja pustego setu dla relacji
                .players(new HashSet<>())
                .build();
    }

    public VenueEntity mapToVenueEntity(VenueSummaryDataDTO dto) {
        if (dto == null) return null;
        return VenueEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .address(dto.getAddress())
                .city(dto.getCity())
                .capacity(dto.getCapacity())
                .surface(dto.getSurface())
                .logoUrl(dto.getLogoUrl())
                .build();
    }

    public PlayerEntity mapToPlayerEntity(PlayerDataDTO dto) {
        return PlayerEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .age(dto.getAge())
                .number(dto.getNumber())
                .position(dto.getPosition()) // Zakładam zgodność enumów lub potrzebę konwersji
                .photo(dto.getPhoto())
                .teams(new HashSet<>())
                .build();
    }
}