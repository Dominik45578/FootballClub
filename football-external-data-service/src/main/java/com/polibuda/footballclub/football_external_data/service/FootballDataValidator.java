package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.football_external_data.dto.clubs.ClubResponseWrapperDTO;
import com.polibuda.footballclub.football_external_data.dto.squads.PlayerDataDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
@Slf4j
public class FootballDataValidator {

    public boolean validateClubData(ClubResponseWrapperDTO wrapper) {
        if (wrapper == null || wrapper.getTeam() == null) {
            log.warn("Received empty club wrapper or team data.");
            return false;
        }
        if (wrapper.getTeam().getName() == null || wrapper.getTeam().getId() == 0) {
            log.warn("Club data invalid (missing ID or Name): {}", wrapper.getTeam());
            return false;
        }
        return true;
    }

    public boolean validatePlayerData(PlayerDataDTO player) {
        if (player == null) return false;
        if (player.getId() == 0 || player.getName() == null) {
            log.warn("Skipping player with invalid data (ID: {}, Name: {})", player.getId(), player.getName());
            return false;
        }
        return true;
    }
}