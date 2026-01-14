package com.polibuda.footballclub.user.service.teamMember;

import com.polibuda.footballclub.common.UserRole;
import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.user.dto.request.JoinTeamRequest;
import com.polibuda.footballclub.user.dto.request.ManageTeamMemberRequest;
import com.polibuda.footballclub.user.dto.request.ManualAddMemberRequest;
import com.polibuda.footballclub.user.dto.response.restricted.TeamMemberListItemDto;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.TeamMemberSearchResponse;
import com.polibuda.footballclub.user.entity.Member;
import com.polibuda.footballclub.user.entity.Team;
import com.polibuda.footballclub.user.entity.TeamMember;
import com.polibuda.footballclub.user.exceptions.InsufficientPermissionsException;
import com.polibuda.footballclub.user.exceptions.business.InvalidTeamCodeException;
import com.polibuda.footballclub.user.exceptions.business.RoleAssigmentExceptions;
import com.polibuda.footballclub.user.exceptions.business.UserAlreadyInTeamException;
import com.polibuda.footballclub.user.exceptions.business.UserAlreadyVerified;
import com.polibuda.footballclub.user.exceptions.notFound.MemberNotFoundException;
import com.polibuda.footballclub.user.exceptions.notFound.TeamMemberNotFoundException;
import com.polibuda.footballclub.user.exceptions.notFound.TeamNotFoundException;
import com.polibuda.footballclub.user.model.SpringSecurityService;
import com.polibuda.footballclub.user.repository.MemberRepository;
import com.polibuda.footballclub.user.repository.TeamMemberRepository;
import com.polibuda.footballclub.user.repository.TeamRepository;
import com.polibuda.footballclub.user.service.IdentityGrpcClient;
import com.polibuda.identify.grpc.RemoveRolesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamMemberServiceImpl implements TeamMemberService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final MemberRepository memberRepository;
    private final IdentityGrpcClient grpcService;
    private final SpringSecurityService springSecurityService;

    @Override
    @Transactional(readOnly = true)
    public TeamMemberSearchResponse getTeamsMemberByStatus(TeamMemberStatus status, Pageable pageable) {
       Page<TeamMember> page = teamMemberRepository.findByStatus(status,pageable);
       List<TeamMemberListItemDto> mapped = page.stream().map(this::mapToTeamMemberDto).toList();
       return TeamMemberSearchResponse.builder()
               .status(status)
               .content(mapped)
               .pageSize(page.getSize())
               .pageNumber(page.getNumber())
               .totalPages(page.getTotalPages())
               .totalElements(page.getTotalElements())
               .build();
    }


    @Override
    @Transactional
    public void joinTeam(Long userId, JoinTeamRequest request) {
        Member member = getMemberByUserId(userId);
        
        Team team = teamRepository.findByCode(request.getTeamCode())
                .orElseThrow(() -> new InvalidTeamCodeException(request.getTeamCode()));

        if (teamMemberRepository.existsByTeamIdAndMemberId(team.getId(), member.getId())) {
            throw new UserAlreadyInTeamException(team.getCode());
        }

        TeamMember newMembership = TeamMember.builder()
                .member(member)
                .team(team)
                .status(TeamMemberStatus.WAITING_FOR_VERIFICATION)
                .build();

        teamMemberRepository.save(newMembership);
        log.info("USER_EVENT: Member {} requested to join team {}", member.getId(), team.getId());
    }

    @Override
    @Transactional
    public void approveMember(Long requesterUserId, Long teamMemberId) {
        TeamMember target = getTargetTeamMember(teamMemberId);
        
        // SECURITY: Contextual Check (Czy requester jest trenerem TEGO zespołu?)
        validateCoachPermissions(target.getTeam().getId(), requesterUserId);

        if (target.getStatus() != TeamMemberStatus.WAITING_FOR_VERIFICATION) {
            throw new UserAlreadyVerified(requesterUserId);
        }

        target.setStatus(TeamMemberStatus.ACTIVE);
        IdentityGrpcClient.RoleGrantResult response =  grpcService.grantRoles(target.getMember().getUserId(), UserRole.ROLE_PLAYER, UserRole.ROLE_MEMBER);
        if(response.status() != IdentityGrpcClient.RoleAssignmentStatusDTO.SUCCESS){
            throw new RoleAssigmentExceptions("Problem was occurred while removing role from user : " + target.getMember().getUserId());
        }
        teamMemberRepository.save(target);
        log.info("COACH_EVENT: User {} approved member {} in team {}", requesterUserId, target.getMember().getId(), target.getTeam().getId());
    }

    @Override
    public TeamMemberListItemDto getTeamMemberById(Long teamMemberId) {
        if(!teamMemberRepository.existsById(teamMemberId)) {
            throw new MemberNotFoundException(teamMemberId);
        }
        TeamMember teamMember = teamMemberRepository.findById(teamMemberId).orElseThrow();
        return mapToTeamMemberDto(teamMember);
    }

    @Override
    @Transactional
    public void rejectOrRemoveMember(Long requesterUserId, Long teamMemberId) {
        TeamMember target = getTargetTeamMember(teamMemberId);
        validateCoachPermissions(target.getTeam().getId(), requesterUserId);

        List<TeamMember> userTeams = teamMemberRepository.findByMemberUserId(target.getMember().getUserId());
        Long teamsCount = userTeams.parallelStream().filter(m -> m.getStatus() == TeamMemberStatus.ACTIVE).count();

        if (target.getStatus() == TeamMemberStatus.WAITING_FOR_VERIFICATION) {
            teamMemberRepository.delete(target);
            if(teamsCount==1){
                IdentityGrpcClient.RoleRemoveResult response = grpcService.removeRoles(target.getMember().getUserId(), UserRole.ROLE_PLAYER);
                if(response.status() != IdentityGrpcClient.RoleAssignmentStatusDTO.SUCCESS){
                    throw new RoleAssigmentExceptions("Problem was occurred while removing role from user : " + target.getMember().getUserId());
                }
                log.info("User lost ROLE_PLAYER because does not have active membership {}", target.getMember().getUserId());
            }//bo 1 teraz usuniemy
            log.info("COACH_EVENT: Application rejected for member {}", target.getId());
        } else {
            target.setStatus(TeamMemberStatus.ARCHIVED);
            teamMemberRepository.save(target);
            log.info("COACH_EVENT: Member {} moved to archive by {}", target.getId(), requesterUserId);
        }
    }

    @Override
    @Transactional
    public void addMemberManually(Long requesterUserId, Long teamId, ManualAddMemberRequest request) {
        validateCoachPermissions(teamId, requesterUserId);

        Member candidate = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new MemberNotFoundException(request.getMemberId()));

        // Fail-fast: Sprawdzenie duplikatów
        if (teamMemberRepository.existsByTeamIdAndMemberId(teamId, candidate.getId())) {
            throw new UserAlreadyInTeamException("Member already in team (ID: " + teamId + ")");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new TeamNotFoundException(teamId));

        // Trener dodaje ręcznie = zaufanie = status ACTIVE
        TeamMember newMember = TeamMember.builder()
                .member(candidate)
                .team(team)
                .status(TeamMemberStatus.ACTIVE)
                .roles(request.getInitialRoles())
                .build();

        teamMemberRepository.save(newMember);
       IdentityGrpcClient.RoleGrantResult response =  grpcService.grantRoles(newMember.getMember().getUserId(), UserRole.ROLE_PLAYER);
        if(response.status() != IdentityGrpcClient.RoleAssignmentStatusDTO.SUCCESS){
            throw new RoleAssigmentExceptions("Problem was occurred while removing role from user : " + candidate.getUserId());
        }
        log.info("COACH_EVENT: Manual add of user {} to team {} by coach {}", candidate.getUserId(), teamId, requesterUserId);
    }

    @Override
    public void updateTeamMember(ManageTeamMemberRequest request, Long requesterUserId) {
        try{
            TeamMember tm = teamMemberRepository.findById(request.getTeamMemberId()).orElseThrow(() -> new TeamMemberNotFoundException(request.getTeamMemberId()));
            validateCoachPermissions(tm.getTeam().getId(), requesterUserId);
            teamMemberRepository.save(checkRequest(request , tm));
        }catch(TeamMemberNotFoundException e){
            throw new TeamMemberNotFoundException(request.getTeamMemberId());
        }catch (IllegalArgumentException e){
            throw new InsufficientPermissionsException("You do not have permission to manage this team member"+request.getTeamMemberId());
        }
    }


    private TeamMember checkRequest(ManageTeamMemberRequest request, TeamMember member){
        if(request.getNewStatus()!=null){
            member.setStatus(request.getNewStatus());
        }
        if(request.getNewRoles()!=null){
            member.addRole(request.getNewRoles());
        }
        if(request.getRemoverRoles()!=null){
            member.removeRole(request.getRemoverRoles());
        }
        return  member;
    }

    // --- Private Helpers ---

    private TeamMember getTargetTeamMember(Long teamMemberId) {
        return teamMemberRepository.findById(teamMemberId)
                .orElseThrow(() -> new TeamMemberNotFoundException(0L, teamMemberId));
    }

    private Member getMemberByUserId(Long userId) {
        return memberRepository.findByUserId(userId)
                .orElseThrow(() -> new MemberNotFoundException("Global User ID: " + userId));
    }

    /**
     * Kluczowa metoda ACL (Access Control List).
     * @PreAuthorize sprawdza "Czy jestem trenerem w ogóle?",
     * Ta metoda sprawdza "Czy jestem trenerem TEGO zespołu?".
     */
    public void validateCoachPermissions(Long teamId, Long userId) {
        // 1. Check Admin Override
        if (springSecurityService.hasRole(UserRole.ROLE_ADMIN)) {
            return;
        }

        // 2. Fetch Team Member Context
        TeamMember requester = teamMemberRepository.findByTeamIdAndMemberUserId(teamId, userId)
                .orElseThrow(() -> new InsufficientPermissionsException(
                        String.format("User %d is not a member of team %d", userId, teamId)
                ));

        // 3. Validate Role within Context
        if (!requester.isCoach()) {
            throw new InsufficientPermissionsException("Operation requires COACH permissions.");
        }
    }

    private TeamMemberListItemDto mapToTeamMemberDto(TeamMember teamMember) {
        return TeamMemberListItemDto.builder()
                .memberId(teamMember.getId())
                .teamMemberId(teamMember.getId())
                .teamId(teamMember.getTeam().getId())
                .firstName(teamMember.getMember().getFirstName())
                .lastName(teamMember.getMember().getLastName())
                .status(teamMember.getStatus())
                .roles(teamMember.getRoles())
                .sienceDate(teamMember.getCreatedAt())
                .build();
    }
}