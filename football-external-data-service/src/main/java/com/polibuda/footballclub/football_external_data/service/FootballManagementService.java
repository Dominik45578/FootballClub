package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.common.actions.AuditActionType;
import com.polibuda.footballclub.football_external_data.aop.Auditable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FootballManagementService {

    private final FootballDomainService domainService;

    @Auditable(actionType = AuditActionType.DELETE, resourceName = "Team", description = "Team deletion")
    public void deleteTeam(Long teamId) {
        log.info("Request to delete team with ID: {}", teamId);
        domainService.deleteTeamCompletely(teamId);
    }

    @Auditable(actionType = AuditActionType.DELETE, resourceName = "Player", description = "Player deletion")
    public void deletePlayer(Long playerId) {
        log.info("Request to delete player with ID: {}", playerId);
        domainService.deletePlayer(playerId);
    }
}