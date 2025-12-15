package com.polibuda.footballclub.user.service.team;

import com.polibuda.footballclub.common.actions.TeamFetchMode;
import com.polibuda.footballclub.user.dto.response.restricted.TeamDetailsResponse;
import com.polibuda.footballclub.user.dto.response.restricted.TeamMemberListItemDto;
import com.polibuda.footballclub.user.dto.response.summary.TeamSummaryResponse;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.TeamSearchResponse;
import com.polibuda.footballclub.user.entity.Team;
import com.polibuda.footballclub.user.exceptions.notFound.TeamNotFoundException;
import com.polibuda.footballclub.user.repository.TeamRepository;
import com.polibuda.footballclub.user.service.team.TeamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;

    @Override
    @Transactional(readOnly = true)
    public TeamSearchResponse getTeams(TeamFetchMode mode,
                                       Long requesterUserId,
                                       Long specificTeamId,
                                       String nameFilter,
                                       Pageable pageable) {
        
        // Pattern Matching dla strategii pobierania (Java 17+ style)
        Page<Team> teamsPage = switch (mode) {
            case MY_TEAMS -> teamRepository.findTeamsByMemberUserId(requesterUserId, pageable);
            case SPECIFIC_TEAM -> teamRepository.findById(specificTeamId)
                    .map(team -> new PageImpl<>(List.of(team)))
                    .orElse(new PageImpl<>(Collections.emptyList())); // Zgodność typów PageImpl
            case ALL_TEAMS -> (nameFilter != null && !nameFilter.isBlank())
                    ? teamRepository.findByNameContainingIgnoreCase(nameFilter, pageable)
                    : teamRepository.findAll(pageable);
        };

        // Mapowanie do lekkiego DTO
        List<TeamSummaryResponse> content = teamsPage.stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());

        // Budowanie Wrappera z metadanymi
        return TeamSearchResponse.builder()
                .appliedFilterName(nameFilter)
                .fetchMode(mode)
                .pageNumber(teamsPage.getNumber())
                .pageSize(teamsPage.getSize())
                .totalElements(teamsPage.getTotalElements())
                .totalPages(teamsPage.getTotalPages())
                .content(content)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TeamDetailsResponse getTeamDetails(Long teamId) {
        // Używamy repozytorium z @EntityGraph (zdefiniowanego w poprzednich krokach)
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException(teamId));

        return mapToDetails(team);
    }

    // --- Mappers (Private Methods for Encapsulation) ---

    private TeamSummaryResponse mapToSummary(Team team) {
        return TeamSummaryResponse.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .category(team.getCategory())
                .numberOfMembers(team.getMembers() != null ? team.getMembers().size() : 0)
                .build();
    }

    private TeamDetailsResponse mapToDetails(Team team) {
        List<TeamMemberListItemDto> members = team.getMembers().stream()
                .map(tm -> TeamMemberListItemDto.builder()
                        .teamMemberId(tm.getId())
                        .memberId(tm.getMember().getId())
                        .firstName(tm.getMember().getFirstName())
                        .lastName(tm.getMember().getLastName())
                        .roles(tm.getRoles())
                        .status(tm.getStatus())
                        .build())
                .collect(Collectors.toList());

        return TeamDetailsResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .code(team.getCode())
                .category(team.getCategory())
                .createdAt(team.getCreatedAt())
                .members(members)
                .build();
    }
}