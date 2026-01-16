package com.polibuda.footballclub.user.service;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.user.entity.Member;
import com.polibuda.footballclub.user.entity.Team;
import com.polibuda.footballclub.user.entity.TeamMember;
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

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchDataService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public Team getTeamWithMembers(Long teamId) {
        return teamRepository.findByIdAndMembers_Status(teamId, TeamMemberStatus.ACTIVE)
                .orElseThrow(() -> new TeamNotFoundException(teamId));
    }

    @Transactional(readOnly = true)
    public TeamMember getTeamMember(Long teamMemberId) {
        return teamMemberRepository.findById(teamMemberId)
                .orElseThrow(() -> new TeamMemberNotFoundException(teamMemberId));
    }

    @Transactional(readOnly = true)
    public Member getMemberPhysicalProfile(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException(memberId));
    }
    @Transactional(readOnly = true)
    public Set<Long> getUserTeams(Long userId) {
        return teamMemberRepository.findByMemberUserIdAndStatus(userId, TeamMemberStatus.ACTIVE).parallelStream()
                .map(m -> m.getTeam().getId()).collect(Collectors.toSet());
    }
}