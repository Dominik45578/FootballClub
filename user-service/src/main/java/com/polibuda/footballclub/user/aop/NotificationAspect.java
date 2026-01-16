package com.polibuda.footballclub.user.aop;

import com.polibuda.footballclub.user.dto.request.JoinTeamRequest;
import com.polibuda.footballclub.user.entity.Member;
import com.polibuda.footballclub.user.entity.Team;
import com.polibuda.footballclub.user.entity.TeamMember;
import com.polibuda.footballclub.user.model.UserEmailTemplates;
import com.polibuda.footballclub.user.repository.MemberRepository;
import com.polibuda.footballclub.user.repository.TeamMemberRepository;
import com.polibuda.footballclub.user.repository.TeamRepository;
import com.polibuda.footballclub.user.service.IdentityGrpcClient;
import com.polibuda.footballclub.user.service.RabbitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationAspect {

    private final RabbitService rabbitService;
    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final IdentityGrpcClient  grpcService;

    // Przechwytujemy dołączenie do zespołu
    @AfterReturning(pointcut = "execution(* com.polibuda.footballclub.user.service.teamMember.TeamMemberServiceImpl.joinTeam(..)) && args(userId, request)", argNames = "userId,request")
    public void afterJoinTeam(Long userId, JoinTeamRequest request) {
        try {
            Member member = memberRepository.findByUserId(userId).orElseThrow();
            Team team = teamRepository.findByCode(request.getTeamCode()).orElseThrow();
            grpcService.getUser(userId).getEmail();

            String email = "pobrany_z_identity_lub_naglowka@test.pl"; 

            String content = UserEmailTemplates.generateJoinRequestSentEmail(member.getFirstName(), team.getName());
            //rabbitService.sendMessage(email, content, "Twoje zgłoszenie do zespołu");
        } catch (Exception e) {
            log.error("Nie udało się wysłać powiadomienia po joinTeam", e);
        }
    }

    // Przechwytujemy akceptację przez trenera
    @AfterReturning(pointcut = "execution(* com.polibuda.footballclub.user.service.teamMember.TeamMemberServiceImpl.approveMember(..)) && args(requesterUserId, teamMemberId)", argNames = "requesterUserId,teamMemberId")
    public void afterMemberApproved(Long requesterUserId, Long teamMemberId) {
        try {
            TeamMember tm = teamMemberRepository.findById(teamMemberId).orElseThrow();
            Member member = tm.getMember();
            
            String content = UserEmailTemplates.generateMembershipApprovedEmail(member.getFirstName(), tm.getTeam().getName());
            //rabbitService.sendMessage("email_uzytkownika@test.pl", content, "Zostałeś przyjęty!");
        } catch (Exception e) {
            log.error("Błąd aspektu przy approveMember", e);
        }
    }
}