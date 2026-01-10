package com.polibuda.footballclub.football_external_data.service;


import com.polibuda.footballclub.common.actions.AuditActionType;
import com.polibuda.footballclub.football_external_data.aop.Auditable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FootballDataSyncService {

    private final FootballImportOrchestrator orchestrator;

    @Auditable(actionType = AuditActionType.SCHEDULED_REFRESH, resourceName = "Team", description = "Scheduled refresh of teams")
    @Scheduled(cron = "${football.sync.cron:0 0 3 * * ?}")
    public void scheduledDailyRefresh() {
        log.info("Starting scheduled data refresh...");
        performBatchRefresh();
    }

    private void performBatchRefresh() {
        orchestrator.runFullImportForCountry("England");
        orchestrator.runFullImportForCountry("Spain");
        orchestrator.runFullImportForCountry("Poland");
        orchestrator.runFullImportForCountry("Germany");
    }

    @Auditable(actionType = AuditActionType.MANUAL_REFRESH, resourceName = "Teams", description = "Manual refresh of teams for country")
    public void forceRefreshTeamsByCountry(String country) {
        log.info("Admin requested refresh for country: {}", country);
        orchestrator.runFullImportForCountry(country);
    }

    @Auditable(actionType = AuditActionType.MANUAL_REFRESH, resourceName = "Squad", description = "Manual refresh of squad for team ID")
    public void forceRefreshSquad(Long teamId) {
        log.info("Admin requested refresh for team ID: {}", teamId);
        orchestrator.importSquadForTeamById(teamId);
    }
}