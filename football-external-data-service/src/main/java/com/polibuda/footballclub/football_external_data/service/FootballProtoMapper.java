package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.football_external_data.dto.clubs.TeamSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.dto.response.PlayerResponseDTO;
import com.polibuda.footballclub.football_external_data.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.football_external_data.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.football_external_data.dto.response.VenueResponseDTO;

import com.polibuda.footballclub.football_external_data.grpc.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class FootballProtoMapper {

    // Mapowanie listy summary (GetAllTeams)
    public TeamSummary toSummaryProto(TeamSummaryDataDTO dto) {
        return TeamSummary.newBuilder()
                .setId(dto.getId())
                .setName(nullSafe(dto.getName()))
                .setCode(nullSafe(dto.getCode()))
                .setCountry(nullSafe(dto.getCountry()))
                .setLogoUrl(nullSafe(dto.getLogoUrl())) // Uwaga: w DTO pole nazywa się 'logo'
                .build();
    }

    // Mapowanie szczegółów (GetTeamDetails)
    public GetTeamDetailsResponse toDetailsResponse(TeamDetailsResponseDTO dto) {
        var builder = GetTeamDetailsResponse.newBuilder()
                .setTeamInfo(toBasicInfoProto(dto.getTeamInfo()));

        if (dto.getVenue() != null) {
            builder.setVenue(toVenueProto(dto.getVenue()));
        }

        List<PlayerResponseDTO> squad = dto.getSquad() != null ? dto.getSquad() : Collections.emptyList();
        squad.forEach(player -> builder.addSquad(toPlayerProto(player)));

        return builder.build();
    }

    private TeamBasicInfo toBasicInfoProto(TeamBasicResponseDTO dto) {
        return TeamBasicInfo.newBuilder()
                .setId(dto.getId())
                .setName(nullSafe(dto.getName()))
                .setCode(nullSafe(dto.getCode()))
                .setCountry(nullSafe(dto.getCountry()))
                .setFounded(dto.getFounded() != null ? dto.getFounded() : 0)
                .setNational(dto.isNational())
                .setLogoUrl(nullSafe(dto.getLogoUrl()))
                .build();
    }

    private Venue toVenueProto(VenueResponseDTO dto) {
        return Venue.newBuilder()
                .setId(dto.getId())
                .setName(nullSafe(dto.getName()))
                .setAddress(nullSafe(dto.getAddress()))
                .setCity(nullSafe(dto.getCity()))
                .setCapacity(dto.getCapacity() != null ? dto.getCapacity() : 0L)
                .setSurface(nullSafe(dto.getSurface()))
                .setLogoUrl(nullSafe(dto.getLogoUrl()))
                .build();
    }

    private Player toPlayerProto(PlayerResponseDTO dto) {
        return Player.newBuilder()
                .setId(dto.getId())
                .setName(nullSafe(dto.getName()))
                .setAge(dto.getAge())
                .setNumber(dto.getNumber())
                .setPosition(nullSafe(dto.getPosition()))
                .setPhotoUrl(nullSafe(dto.getPhotoUrl()))
                .build();
    }

    // Helper method to avoid NPE in Protobuf builders
    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}