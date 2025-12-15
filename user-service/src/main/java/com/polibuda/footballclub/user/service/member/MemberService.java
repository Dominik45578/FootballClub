package com.polibuda.footballclub.user.service.member;

import com.polibuda.footballclub.user.dto.request.UpdateMemberProfileRequest;
import com.polibuda.footballclub.user.dto.response.restricted.MemberProfileResponse;
import com.polibuda.footballclub.user.dto.response.summary.MemberSummaryResponse;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.MemberSearchResponse;
import org.springframework.data.domain.Pageable;

public interface MemberService {

    /**
     * Pobiera pełny profil zalogowanego użytkownika.
     * Zawiera dane wrażliwe (np. zamaskowany PESEL).
     *
     * @param userId Globalne ID użytkownika (z tokena)
     * @return Profil użytkownika
     */
    MemberProfileResponse getMyProfile(Long userId);
    MemberSummaryResponse getMemberProfile(Long userId);

    /**
     * Aktualizuje dane edytowalne przez użytkownika (waga, wzrost, telefon).
     *
     * @param userId Globalne ID użytkownika
     * @param request Obiekt z polami do aktualizacji (pola null są ignorowane)
     * @return Zaktualizowany profil
     */
    MemberProfileResponse updateMyProfile(Long userId, UpdateMemberProfileRequest request);

    /**
     * Publiczna wyszukiwarka użytkowników (np. dla trenera szukającego graczy).
     * Zwraca dane bezpieczne (MemberSummary) bez PESELU i numeru telefonu.
     *
     * @param query Fraza wyszukiwania (fragment imienia lub nazwiska)
     * @param pageable Parametry stronicowania
     * @return Wrapper z bezpieczną listą użytkowników
     */
    MemberSearchResponse searchMembers(String query, Pageable pageable);
}