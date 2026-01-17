package com.polibuda.footballclub.user.service.team;

import com.polibuda.footballclub.common.UserRole;
import com.polibuda.footballclub.common.actions.TeamFetchMode;
import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.database.TeamStatus;
import com.polibuda.footballclub.user.dto.request.*;
import com.polibuda.footballclub.user.dto.response.restricted.TeamDetailsResponse;
import com.polibuda.footballclub.user.dto.response.restricted.TeamMemberListItemDto;
import com.polibuda.footballclub.user.dto.response.summary.TeamSummaryResponse;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.TeamSearchResponse;
import com.polibuda.footballclub.user.entity.Team;
import com.polibuda.footballclub.user.entity.TeamMember;
import com.polibuda.footballclub.user.exceptions.InsufficientPermissionsException;
import com.polibuda.footballclub.user.exceptions.business.BadEndpointException;
import com.polibuda.footballclub.user.exceptions.business.TeamAlreadyExistExceptions;
import com.polibuda.footballclub.user.exceptions.notFound.TeamMemberNotFoundException;
import com.polibuda.footballclub.user.exceptions.notFound.TeamNotFoundException;
import com.polibuda.footballclub.user.model.SecurityService;
import com.polibuda.footballclub.user.model.SpringSecurityService;
import com.polibuda.footballclub.user.repository.TeamMemberRepository;
import com.polibuda.footballclub.user.repository.TeamRepository;
import com.polibuda.footballclub.user.service.IdentityGrpcClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.BeanDefinitionDsl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.management.relation.RoleNotFoundException;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final SpringSecurityService springSecurityService;
    private final IdentityGrpcClient identityGrpcClient;

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


        TeamDetailsResponse res =  mapToDetails(team);
        return res;
    }

    @Override
    public TeamSummaryResponse getTeamProfile(Long teamId) {
        return teamRepository.findById(teamId)
                .map(this::mapToSummary)
                .orElseThrow(() -> new TeamNotFoundException(teamId));
    }


    @Override
    @Transactional
    public boolean addTeam(AddTeamRequest team, Long requesterUserId) {
        if(teamRepository.existsByCode(team.getCode())){
            throw new TeamAlreadyExistExceptions();
        }
        try{
            log.debug("[TeamServiceImpl.addTeam] received AddTeamRequest: name={}, code={}, category={}, status={}, descriptionLen={}",
                    team.getName(), team.getCode(), team.getCategory(), team.getStatus(), team.getDescription() == null ? 0 : team.getDescription().length());
             if(springSecurityService.hasRole(UserRole.ROLE_COACH) && !springSecurityService.hasRole(UserRole.ROLE_ADMIN)){

             }
            Team saved = teamRepository.save(
                    Team.builder()
                            .name(team.getName())
                            .category(team.getCategory())
                            .code(team.getCode())
                            .description(team.getDescription())
                            .status(team.getStatus())
                            .build()
            );
            log.debug("[TeamServiceImpl.addTeam] saved Team id={} status={}", saved.getId(), saved.getStatus());
             return true;
         }catch (Exception e){
             return false;
         }

    }

    @Override
    @Transactional
    public boolean updateTeam(UpdateTeamRequestDTO request, Long requesterUserId) {
        if(!teamRepository.existsById(request.getId())){
            return false;
        }
        if(request.getStatus()== TeamStatus.ARCHIVED){
            throw new BadEndpointException("You cannot archive team there- use endpoint created form this order");
        }

        Team team = teamRepository.findById(request.getId()).orElseThrow(() -> new TeamNotFoundException(request.getId()));
        validateCoachPermissions(team.getId(),requesterUserId);
        teamRepository.save(checkDtoAndSetChanges(request,team));
        return true;
    }

    @Transactional
    @Override
    public boolean updateMembership(ManageTeamMemberRequest request, Long requesterUserId) {
       if(!teamMemberRepository.existsById(request.getTeamMemberId())){
           return false;
       }

       TeamMember target = teamMemberRepository.findById(request.getTeamMemberId()).orElseThrow(() -> new TeamMemberNotFoundException(request.getTeamMemberId()));
       validateCoachPermissions(target.getTeam().getId(),requesterUserId);
        teamMemberRepository.save(checkDtoAndSetChanges(request,target));
        log.debug("Successf`ully updated team membership with id={}", requesterUserId);
        return true;
    }

    private TeamMember checkDtoAndSetChanges(ManageTeamMemberRequest request, TeamMember membership){
        if(request.getNewRoles()!=null){
            membership.addRole(request.getNewRoles());
        }
        if(request.getRemovedRoles()!=null){
            membership.removeRole(request.getRemovedRoles());
        }
        if(request.getStatus()!=null){
            membership.setStatus(request.getStatus());
        }
        if(request.getNumber()!= null){
            membership.setNumber(request.getNumber());
        }
        if(request.getNewFieldPosition()!=null){
            membership.setFieldPosition(request.getNewFieldPosition());
        }
        return membership;
    }

    private Team checkDtoAndSetChanges(UpdateTeamRequestDTO request,Team team){
        if(request.getName() != null){
            team.setName(request.getName());
        }
        if(request.getDescription() != null){
            team.setDescription(request.getDescription());
        }
        if(request.getCategory() != null){
            team.setCategory(request.getCategory());
        }
        if(request.getStatus() != null) {
            team.setStatus(request.getStatus());
        }

        return team;
    }


    @Override
    @Transactional
    public boolean deleteTeam(Long teamId, Long requesterUserId) {
        if(!teamRepository.existsById(teamId)){
            log.error("Team id {} does not exist", teamId);
            throw new TeamNotFoundException(teamId);
        }
        try{
            Team team = teamRepository.findById(teamId).orElseThrow(() -> new TeamNotFoundException(teamId));
            validateCoachPermissions(team.getId(),requesterUserId);
            Set<TeamMember> members = team.getMembers();
            for(TeamMember member : members){
                member.setStatus(TeamMemberStatus.ARCHIVED);
                teamMemberRepository.save(member);
            }
            team.setStatus(TeamStatus.ARCHIVED);
            teamRepository.save(team);
            return true;
        }catch (Exception e){
            log.error("Problem while deleting team {}", teamId, e);
            return false;
        }
    }

    // --- Mappers (Private Methods for Encapsulation) ---

    private TeamSummaryResponse mapToSummary(Team team) {
        return TeamSummaryResponse.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .category(team.getCategory())
                .status(team.getStatus())
                .createdAt(team.getCreatedAt())
                .description(team.getDescription())
                .numberOfMembers(team.getMembers() != null ? team.getMembers().size() : 0)
                .build();
    }

    @Transactional
    protected TeamDetailsResponse mapToDetails(Team team) {
        List<TeamMemberListItemDto> members = team.getMembers().stream()
                .map(tm -> TeamMemberListItemDto.builder()
                        .teamMemberId(tm.getId())
                        .memberId(tm.getMember().getId())
                        .firstName(tm.getMember().getFirstName())
                        .lastName(tm.getMember().getLastName())
                        .roles(Set.copyOf(tm.getRoles()))
                        .status(tm.getStatus())
                        .sienceDate(tm.getCreatedAt())
                        .fieldPosition(tm.getFieldPosition())
                        .number(tm.getNumber())
                        .build())
                .collect(Collectors.toList());

        return TeamDetailsResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .code(team.getCode())
                .category(team.getCategory())
                .createdAt(team.getCreatedAt())
                .members(members)
                .description(team.getDescription())
                .build();
    }

    public void validateCoachPermissions(Long teamId, Long userId) {
        if (springSecurityService.hasRole(UserRole.ROLE_ADMIN)) {
            return;
        }

        TeamMember requester = teamMemberRepository.findByTeamIdAndMemberUserId(teamId, userId)
                .orElseThrow(() -> new InsufficientPermissionsException(
                        String.format("User %d is not a member of team %d", userId, teamId)
                ));
        if (!requester.isCoach()) {
            throw new InsufficientPermissionsException("Operation requires COACH permissions.");
        }
        if(!requester.getStatus().equals(TeamMemberStatus.ACTIVE)){
            throw new InsufficientPermissionsException("Operation requires ACTIVE COACH permissions.");
        }
    }
}