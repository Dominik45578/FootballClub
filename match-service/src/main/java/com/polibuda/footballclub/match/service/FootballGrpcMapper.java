package com.polibuda.footballclub.match.service;


import com.polibuda.footballclub.football_external_data.grpc.*;
import com.polibuda.footballclub.match.dto.response.PlayerResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.dto.response.VenueResponseDTO;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class FootballGrpcMapper {

    public TeamBasicResponseDTO mapToBasicDto(TeamSummary proto) {
        return TeamBasicResponseDTO.builder()
                .id(proto.getId())
                .name(proto.getName())
                .code(proto.getCode())
                .country(proto.getCountry())
                .logoUrl(proto.getLogoUrl())
                .build();
    }

    public TeamDetailsResponseDTO mapToDetailsDto(GetTeamDetailsResponse proto) {
        return TeamDetailsResponseDTO.builder()
                .teamInfo(mapToBasicInfo(proto.getTeamInfo()))
                .venue(proto.hasVenue() ? mapToVenue(proto.getVenue()) : null)
                .squad(proto.getSquadList().stream()
                        .map(this::mapToPlayer)
                        .collect(Collectors.toList()))
                .build();
    }

    private TeamBasicResponseDTO mapToBasicInfo(TeamBasicInfo proto) {
        return TeamBasicResponseDTO.builder()
                .id(proto.getId())
                .name(proto.getName())
                .code(proto.getCode())
                .country(proto.getCountry())
                .founded(proto.getFounded())
                .national(proto.getNational())
                .logoUrl(proto.getLogoUrl())
                .build();
    }

    private VenueResponseDTO mapToVenue(Venue proto) {
        return VenueResponseDTO.builder()
                .id(proto.getId())
                .name(proto.getName())
                .address(proto.getAddress())
                .city(proto.getCity())
                .capacity(proto.getCapacity())
                .surface(proto.getSurface())
                .logoUrl(proto.getLogoUrl())
                .build();
    }

    private PlayerResponseDTO mapToPlayer(Player proto) {
        return PlayerResponseDTO.builder()
                .id(proto.getId())
                .name(proto.getName())
                .age(proto.getAge())
                .number(proto.getNumber())
                .position(proto.getPosition())
                .photoUrl(proto.getPhotoUrl())
                .build();
    }
}