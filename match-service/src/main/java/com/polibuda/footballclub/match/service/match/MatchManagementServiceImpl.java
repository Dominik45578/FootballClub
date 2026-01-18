package com.polibuda.footballclub.match.service.match;

import com.polibuda.footballclub.common.database.TeamStatus;
import com.polibuda.footballclub.match.MatchStatus;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.request.CreateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.request.UpdateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchResponseDTO;
import com.polibuda.footballclub.match.entity.Match;
import com.polibuda.footballclub.match.exceptions.*;
import com.polibuda.footballclub.match.mappers.MatchMapper;
import com.polibuda.footballclub.match.model.SecurityContextHelper;
import com.polibuda.footballclub.match.service.domain.MatchEntityService;
import com.polibuda.footballclub.match.service.domain.TeamProviderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchManagementServiceImpl implements MatchManagementService {

    private final MatchEntityService matchEntityService;
    private final TeamProviderService teamProviderService;
    private final SecurityContextHelper securityHelper;
    private final MatchMapper matchMapper;

    @Override
    @Transactional(readOnly = true)
    public MatchResponseDTO getMatchById(Long matchId) {
        Match match = matchEntityService.getById(matchId);
        return enrichAndMap(match);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MatchResponseDTO> getMyMatches(Pageable pageable) {
        Long userId = securityHelper.getCurrentUserId();

        List<Long> userTeamIds = teamProviderService.getInternalTeamIds(userId);

        if (userTeamIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Page<Match> matches = matchEntityService.getAllByInternalTeamIdIn(userTeamIds, pageable);
        return matches.map(this::enrichAndMap);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MatchResponseDTO> getMatchesByTeamId(Long internalTeamId, Pageable pageable) {
        Page<Match> matches = matchEntityService.getAllByInternalTeamId(internalTeamId, pageable);
        return matches.map(this::enrichAndMap);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MatchResponseDTO> getAllMatches(Pageable pageable) {
        Page<Match> matches = matchEntityService.getAllMatches(pageable);
        return matches.map(this::enrichAndMap);
    }


    @Override
    @Transactional
    public MatchResponseDTO createMatch(CreateMatchRequestDTO request) {
        Long userId = securityHelper.getCurrentUserId();

        // 1. Walidacja uprawnień (delegacja do providera)
        if (!securityHelper.isAdmin()) {
            teamProviderService.validateUserIsCoach(userId, request.getInternalTeamId());
        }

        validateMatchCreationLogic(request);

        verifyTeamsAvailability(request.getInternalTeamId(), request.getExternalTeamId());


        Match match = Match.builder()
                .internalTeamId(request.getInternalTeamId())
                .externalTeamId(request.getExternalTeamId())
                .matchDate(request.getMatchDate())
                .isInternalTeamHome(request.getIsHome())
                .status(MatchStatus.SCHEDULED)
                .build();

        Match saved = matchEntityService.save(match);
        log.info("MATCH_CREATED: ID={} by User={}", saved.getId(), userId);
        return enrichAndMap(saved);
    }

    @Override
    @Transactional
    public MatchResponseDTO updateMatch(Long matchId, UpdateMatchRequestDTO request) {
        Long userId = securityHelper.getCurrentUserId();
        Match match = matchEntityService.getById(matchId);


        if (!securityHelper.isAdmin()) {
            teamProviderService.validateUserIsCoach(userId, match.getInternalTeamId());
        }

        validateMatchUpdateLogic(match, request);

        boolean dateChanged = handleDateChange(match, request.getMatchDate());

        updateMatchFields(match, request);

        Match updated = matchEntityService.save(match);
        if (dateChanged) {
            log.info("MATCH_RESCHEDULED: ID={} NewDate={}", updated.getId(), updated.getMatchDate());
        }

        return enrichAndMap(updated);
    }

    @Override
    @Transactional
    public void deleteMatch(Long matchId) {
        Long userId = securityHelper.getCurrentUserId();
        Match match = matchEntityService.getById(matchId);

        if (!securityHelper.isAdmin()) {
            teamProviderService.validateUserIsCoach(userId, match.getInternalTeamId());
        }

        matchEntityService.delete(matchId);
        log.info("MATCH_DELETED: ID={} by User={}", matchId, userId);
    }

    // --- PRYWATNE METODY POMOCNICZE (Private Helpers) ---

    private void validateMatchCreationLogic(CreateMatchRequestDTO request) {
        if (request.getInternalTeamId().equals(request.getExternalTeamId())) {
            throw new InvalidTeamPairingException("A team cannot play a match against itself.");
        }
        if (request.getMatchDate().isBefore(LocalDateTime.now())) {
            throw new MatchDateInPastException("Cannot schedule a new match in the past.");
        }
        if (matchEntityService.isTermTaken(request.getInternalTeamId(), request.getMatchDate())) {
            throw new MatchDateConflictException("The internal team already has a match scheduled within 2 hours of this time.");
        }
    }

    private void verifyTeamsAvailability(Long internalTeamId, Long externalTeamId) {
        MatchTeamDto team = teamProviderService.getInternalTeam(internalTeamId);
        if (team.getStatus() != TeamStatus.ACTIVE) {
            throw new TeamMustBeActiveException("Internal team status must be ACTIVE to schedule matches.");
        }
        // Sprawdzenie czy zewnętrzny zespół istnieje (rzuca wyjątek jeśli nie)
        teamProviderService.getExternalTeamDetails(externalTeamId);
    }

    private void validateMatchUpdateLogic(Match match, UpdateMatchRequestDTO request) {
        // Walidacja statusu
        if (request.getStatus() != null) {
            if (match.getStatus() == MatchStatus.FINISHED && request.getStatus() == MatchStatus.SCHEDULED) {
                throw new InvalidMatchStatusTransitionException("Cannot revert a FINISHED match to SCHEDULED status.");
            }
            if (match.getStatus() == MatchStatus.CANCELLED) {
                throw new InvalidMatchStatusTransitionException("Cannot update a CANCELLED match.");
            }
        }

        // Walidacja wyników
        if (request.getInternalTeamScore() != null || request.getExternalTeamScore() != null) {
            if (match.getStatus() == MatchStatus.SCHEDULED) {
                throw new InvalidMatchScoreException("Cannot set scores for a match that is only SCHEDULED.");
            }
            validateScoreNonNegative(request.getInternalTeamScore());
            validateScoreNonNegative(request.getExternalTeamScore());
        }
    }

    private void validateScoreNonNegative(Long score) {
        if (score != null && score < 0) {
            throw new InvalidMatchScoreException("Match scores cannot be negative.");
        }
    }

    private boolean handleDateChange(Match match, LocalDateTime newDate) {
        if (newDate == null) {
            return true;
        }

        if (matchEntityService.isTermTaken(match.getInternalTeamId(), newDate)) {
            throw new MatchDateConflictException("The new date conflicts with another match within 2 hours.");
        }
        match.setMatchDate(newDate);
        return true;
    }

    private void updateMatchFields(Match match, UpdateMatchRequestDTO request) {
        if (request.getIsHome() != null) {
            match.setIsInternalTeamHome(request.getIsHome());
        }
        if (request.getStatus() != null) {
            match.setStatus(request.getStatus());
        }
        if (request.getExternalTeamScore() != null) {
            match.setExternalTeamScore(request.getExternalTeamScore());
        }
        if (request.getInternalTeamScore() != null) {
            match.setInternalTeamScore(request.getInternalTeamScore());
        }
    }

    private MatchResponseDTO enrichAndMap(Match match) {
        var internal = teamProviderService.getInternalTeam(match.getInternalTeamId());
        var external = teamProviderService.getExternalTeamDetails(match.getExternalTeamId());
        return matchMapper.toDto(match, internal, external);
    }
}