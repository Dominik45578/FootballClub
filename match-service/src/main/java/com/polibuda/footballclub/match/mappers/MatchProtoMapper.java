package com.polibuda.footballclub.match.mappers;

import com.polibuda.footballclub.match.dto.fromMatchService.MatchMemberDto;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.fromMatchService.PhysicalProfileDto;
import com.polibuda.footballclub.match.grpc.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class MatchProtoMapper {

    public MatchTeamDto toDto(TeamForMatchResponse response) {
        return MatchTeamDto.builder()
                .teamId(response.getTeamId())
                .teamName(response.getTeamName())
                .category(response.getCategory())
                .members(mapMembers(response.getMembersList()))
                .build();
    }

    public MatchMemberDto toDto(TeamMemberForMatchResponse response) {
        return MatchMemberDto.builder()
                .teamMemberId(response.getTeamMemberId())
                .memberId(response.getMemberId())
                .firstName(response.getFirstName())
                .lastName(response.getLastName())
                .status(response.getStatus().name())
                .fieldPosition(response.getFieldPosition().name())
                .roles(mapRoles(response.getRolesList()))
                .number(response.getNumber())
                .build();
    }

    public PhysicalProfileDto toDto(PlayerPhysicalProfileResponse response) {
        return PhysicalProfileDto.builder()
                .memberId(response.getMemberId())
                .userId(response.getUserId())
                .firstName(response.getFirstName())
                .lastName(response.getLastName())
                .build();
    }

    private List<MatchMemberDto> mapMembers(List<MatchTeamMemberDto> protoMembers) {
        if (protoMembers == null) return Collections.emptyList();
        return protoMembers.stream()
                .map(this::mapSingleMember)
                .collect(Collectors.toList());
    }

    private MatchMemberDto mapSingleMember(MatchTeamMemberDto proto) {
        return MatchMemberDto.builder()
                .teamMemberId(proto.getTeamMemberId())
                .memberId(proto.getMemberId())
                .firstName(proto.getFirstName())
                .lastName(proto.getLastName())
                .status(proto.getStatus().name())
                .fieldPosition(proto.getFieldPosition().name())
                .roles(mapRoles(proto.getRolesList()))
                .number(proto.getNumber())
                .build();
    }

    private Set<String> mapRoles(List<MatchTeamRole> roles) {
        if (roles == null) return Collections.emptySet();
        return roles.stream()
                .map(Enum::name)
                .collect(Collectors.toSet());
    }

    private LocalDate parseDate(String dateStr) {
        try {
            return (dateStr != null && !dateStr.isBlank()) ? LocalDate.parse(dateStr) : null;
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}