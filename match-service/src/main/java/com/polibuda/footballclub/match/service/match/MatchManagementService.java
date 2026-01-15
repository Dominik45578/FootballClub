package com.polibuda.footballclub.match.service.match;

import com.polibuda.footballclub.match.dto.request.CreateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.request.UpdateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MatchManagementService {

    // --- Odczyt (Read) ---
    
    MatchResponseDTO getMatchById(Long matchId);

    /**
     * Zwraca mecze dla zalogowanego użytkownika.
     * Logika: Pobiera ID zespołów użytkownika -> Pobiera mecze tych zespołów.
     */
    Page<MatchResponseDTO> getMyMatches(Pageable pageable);

    /**
     * Zwraca mecze konkretnego zespołu (np. terminarz publiczny).
     */
    Page<MatchResponseDTO> getMatchesByTeamId(Long internalTeamId, Pageable pageable);

    // --- Zarządzanie (Write) ---

    MatchResponseDTO createMatch(CreateMatchRequestDTO request);

    MatchResponseDTO updateMatch(Long matchId, UpdateMatchRequestDTO request);

    void deleteMatch(Long matchId);
}