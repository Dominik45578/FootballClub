package com.polibuda.footballclub.user.service.teamMember;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.user.dto.request.JoinTeamRequest;
import com.polibuda.footballclub.user.dto.request.ManualAddMemberRequest;
import com.polibuda.footballclub.user.entity.Member;
import com.polibuda.footballclub.user.entity.Team;
import com.polibuda.footballclub.user.entity.TeamMember;
import com.polibuda.footballclub.user.exceptions.InsufficientPermissionsException;
import com.polibuda.footballclub.user.exceptions.business.BusinessLogicException;
import com.polibuda.footballclub.user.exceptions.business.InvalidTeamCodeException;
import com.polibuda.footballclub.user.exceptions.business.UserAlreadyInTeamException;
import com.polibuda.footballclub.user.exceptions.business.UserAlreadyVerified;
import com.polibuda.footballclub.user.exceptions.notFound.MemberNotFoundException;
import com.polibuda.footballclub.user.exceptions.notFound.TeamMemberNotFoundException;
import com.polibuda.footballclub.user.exceptions.notFound.TeamNotFoundException;
import com.polibuda.footballclub.user.repository.MemberRepository;
import com.polibuda.footballclub.user.repository.TeamMemberRepository;
import com.polibuda.footballclub.user.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamMemberServiceImpl implements TeamMemberService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final MemberRepository memberRepository;

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
        teamMemberRepository.save(target);
        log.info("COACH_EVENT: User {} approved member {} in team {}", requesterUserId, target.getMember().getId(), target.getTeam().getId());
    }

    @Override
    @Transactional
    public void rejectOrRemoveMember(Long requesterUserId, Long teamMemberId) {
        TeamMember target = getTargetTeamMember(teamMemberId);
        validateCoachPermissions(target.getTeam().getId(), requesterUserId);

        if (target.getStatus() == TeamMemberStatus.WAITING_FOR_VERIFICATION) {
            // Hard delete dla odrzuconej aplikacji
            teamMemberRepository.delete(target);
            log.info("COACH_EVENT: Application rejected for member {}", target.getId());
        } else {
            // Soft delete (archiwizacja) dla byłego członka
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
                .build();

        teamMemberRepository.save(newMember);
        log.info("COACH_EVENT: Manual add of user {} to team {} by coach {}", candidate.getId(), teamId, requesterUserId);
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
    private void validateCoachPermissions(Long teamId, Long userId) {
        TeamMember requester = teamMemberRepository.findByTeamIdAndMemberUserId(teamId, userId)
                .orElseThrow(() -> new InsufficientPermissionsException("You are not part of this team context."));

        if (!requester.isCoach()) {
            throw new InsufficientPermissionsException("Contextual Permission Denied: Role COACH required in this team.");
        }
    }
}