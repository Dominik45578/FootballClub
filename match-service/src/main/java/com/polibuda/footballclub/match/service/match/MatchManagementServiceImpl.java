package com.polibuda.footballclub.match.service.match;

import com.polibuda.footballclub.match.MatchStatus;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.request.CreateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.request.UpdateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchResponseDTO;
import com.polibuda.footballclub.match.entity.Match;
import com.polibuda.footballclub.match.exceptions.InsufficientPermissionsException;
import com.polibuda.footballclub.match.exceptions.MatchSerwisExceptions;
import com.polibuda.footballclub.match.exceptions.ResourceNotFoundException;
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

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchManagementServiceImpl implements MatchManagementService {

    private final MatchEntityService matchEntityService;
    private final TeamProviderService teamProviderService;
    private final SecurityContextHelper securityHelper;
    private final MatchMapper matchMapper;

    // --- ODCZYT (READ) ---

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

        // 1. Pobieramy ID zespołów użytkownika z User Service
        List<Long> userTeamIds = teamProviderService.getInternalTeamIds(userId);

        if (userTeamIds.isEmpty()) {
            return Page.empty(pageable);
        }

        // 2. Pobieramy mecze dla tych zespołów
        Page<Match> matches = matchEntityService.getAllByInternalTeamIdIn(userTeamIds, pageable);

        // 3. Mapujemy i wzbogacamy o nazwy drużyn
        return matches.map(this::enrichAndMap);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MatchResponseDTO> getMatchesByTeamId(Long internalTeamId, Pageable pageable) {
        // Pobieramy mecze konkretnej drużyny (np. widok terminarza)
        Page<Match> matches = matchEntityService.getAllByInternalTeamId(internalTeamId, pageable);
        return matches.map(this::enrichAndMap);
    }

    // --- ZAPIS / EDYCJA (WRITE) ---

    @Override
    @Transactional
    public MatchResponseDTO createMatch(CreateMatchRequestDTO request) {
        Long userId = securityHelper.getCurrentUserId();

        // 1. Walidacja uprawnień: Tylko Admin lub Trener tej drużyny może dodać mecz
        validateCoachOrAdmin(request.getInternalTeamId(), userId);

        // 2. Walidacja terminu: Czy drużyna nie ma już meczu w tym czasie?
        if (matchEntityService.isTermTaken(request.getInternalTeamId(), request.getMatchDate())) {
            throw new MatchSerwisExceptions("Wybrany termin jest już zajęty przez inny mecz tej drużyny.");
        }

        // 3. Tworzenie encji
        Match match = Match.builder()
                .internalTeamId(request.getInternalTeamId())
                .externalTeamId(request.getExternalTeamId())
                .matchDate(request.getMatchDate())
                .isInternalTeamHome(request.getIsHome())
                .status(MatchStatus.SCHEDULED) // Domyślnie planowany
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

        // 1. Walidacja uprawnień do edycji tego konkretnego meczu
        validateCoachOrAdmin(match.getInternalTeamId(), userId);

        // 2. Aktualizacja pól (jeśli zostały przesłane)
        boolean dateChanged = false;

        if (request.getMatchDate() != null) {
            // Jeśli data się zmienia, sprawdzamy czy nowy termin jest wolny
            if (!request.getMatchDate().isEqual(match.getMatchDate())) {
                if (matchEntityService.isTermTaken(match.getInternalTeamId(), request.getMatchDate())) {
                    throw new MatchSerwisExceptions("Nowy termin jest kolizyjny z innym meczem.");
                }
                match.setMatchDate(request.getMatchDate());
                dateChanged = true;
            }
        }

        if (request.getIsHome() != null) {
            match.setIsInternalTeamHome(request.getIsHome());
        }

        if (request.getStatus() != null) {
            match.setStatus(request.getStatus());
        }
        if(request.getExternalTeamScore()!=null){
            match.setExternalTeamScore(request.getExternalTeamScore());
        }
        if (request.getInternalTeamScore()!=null){
            match.setInternalTeamScore(request.getInternalTeamScore());
        }

        Match updated = matchEntityService.save(match);
        if(dateChanged) {
            log.info("MATCH_RESCHEDULED: ID={} NewDate={}", updated.getId(), updated.getMatchDate());
        }

        return enrichAndMap(updated);
    }

    @Override
    @Transactional
    public void deleteMatch(Long matchId) {
        Long userId = securityHelper.getCurrentUserId();
        Match match = matchEntityService.getById(matchId);

        // 1. Walidacja uprawnień
        validateCoachOrAdmin(match.getInternalTeamId(), userId);

        // 2. Usunięcie
        matchEntityService.delete(matchId);
        log.info("MATCH_DELETED: ID={} by User={}", matchId, userId);
    }

    @Override
    public Page<MatchResponseDTO> getAllMatches(Pageable pageable) {
        var matches = matchEntityService.getAllMatches(pageable);
        return matches.map(this::enrichAndMap);
    }

    // --- METODY POMOCNICZE (PRIVATE) ---

    /**
     * Wzbogaca "gołą" encję Match o dane drużyn pobrane z mikroserwisów.
     */
    private MatchResponseDTO enrichAndMap(Match match) {
        // Pobieramy dane bezpiecznie (try-catch wewnątrz metod), żeby awaria gRPC nie kładła całego get-a
        var internal = fetchInternalTeamSafe(match.getInternalTeamId());
        var external = fetchExternalTeamSafe(match.getExternalTeamId());

        return matchMapper.toDto(match,internal,external);
    }

    private MatchTeamDto fetchInternalTeamSafe(Long id) {
        try {
            return teamProviderService.getInternalTeam(id);
        } catch (Exception e) {
            log.warn("Failed to fetch internal team info for ID: {}", id);
            return MatchTeamDto.builder().teamId(id).teamName("Unknown Internal Team").build();
        }
    }

    private TeamDetailsResponseDTO fetchExternalTeamSafe(Long id) {
        try {
            return teamProviderService.getExternalTeamDetails(id);
        } catch (Exception e) {
            log.warn("Failed to fetch external team info for ID: {}", id);
            throw new ResourceNotFoundException("External Team not found via gRPC, id: " + id);
        }
    }

    /**
     * Sprawdza, czy użytkownik ma prawo zarządzać meczami danej drużyny.
     * Prawo ma ADMIN oraz TRENER (COACH) tej drużyny.
     */
    private void validateCoachOrAdmin(Long teamId, Long userId) {
        if (securityHelper.isAdmin()) {
            return;
        }
        // Delegujemy sprawdzenie do TeamProviderService, który odpyta User Service via gRPC
        boolean isCoach = teamProviderService.isUserCoachOfTeam(userId, teamId);

        if (!isCoach) {
            throw new InsufficientPermissionsException("Nie masz uprawnień trenera do zarządzania meczami tej drużyny.");
        }
    }
}