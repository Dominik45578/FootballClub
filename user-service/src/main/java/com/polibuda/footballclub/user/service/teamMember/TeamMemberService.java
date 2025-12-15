package com.polibuda.footballclub.user.service.teamMember;

import com.polibuda.footballclub.user.dto.request.JoinTeamRequest;
import com.polibuda.footballclub.user.dto.request.ManualAddMemberRequest;

public interface TeamMemberService {

    /**
     * Akcja gracza: Dołączenie do zespołu przy użyciu unikalnego kodu.
     * Tworzy relację ze statusem WAITING_FOR_VERIFICATION.
     *
     * @param userId ID użytkownika dołączającego
     * @param request Obiekt zawierający kod zespołu
     */
    void joinTeam(Long userId, JoinTeamRequest request);

    /**
     * Akcja trenera: Zatwierdzenie oczekującego gracza.
     * Zmienia status z WAITING -> ACTIVE.
     *
     * @param requesterUserId ID trenera wykonującego akcję (do weryfikacji uprawnień)
     * @param teamMemberId ID relacji (nie ID usera!) do zatwierdzenia
     */
    void approveMember(Long requesterUserId, Long teamMemberId);

    /**
     * Akcja trenera: Odrzucenie aplikacji LUB usunięcie/archiwizacja obecnego gracza.
     * WAITING -> DELETE
     * ACTIVE -> ARCHIVED
     *
     * @param requesterUserId ID trenera
     * @param teamMemberId ID relacji
     */
    void rejectOrRemoveMember(Long requesterUserId, Long teamMemberId);

    /**
     * Akcja trenera: Ręczne dodanie gracza do zespołu (bez kodu).
     * Pomija proces weryfikacji (od razu status ACTIVE).
     *
     * @param requesterUserId ID trenera
     * @param teamId ID zespołu, do którego dodajemy
     * @param request Obiekt zawierający ID kandydata (znalezionego wcześniej w searchMembers)
     */
    void addMemberManually(Long requesterUserId, Long teamId, ManualAddMemberRequest request);
}