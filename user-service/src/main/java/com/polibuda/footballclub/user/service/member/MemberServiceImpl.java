package com.polibuda.footballclub.user.service.member;

import com.polibuda.footballclub.common.UserRole;
import com.polibuda.footballclub.user.dto.request.NewMemberRequestDTO;
import com.polibuda.footballclub.user.dto.request.UpdateMemberProfileRequest;
import com.polibuda.footballclub.user.dto.response.restricted.MemberProfileResponse;
import com.polibuda.footballclub.user.dto.response.summary.MemberSummaryResponse;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.MemberSearchResponse;
import com.polibuda.footballclub.user.entity.Member;
import com.polibuda.footballclub.user.exceptions.business.MemberAlreadyExistExceptions;
import com.polibuda.footballclub.user.exceptions.business.RoleAssigmentExceptions;
import com.polibuda.footballclub.user.exceptions.notFound.MemberNotFoundException;
import com.polibuda.footballclub.user.repository.MemberRepository;
import com.polibuda.footballclub.user.service.IdentityGrpcClient;
import com.polibuda.footballclub.user.service.member.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final IdentityGrpcClient grpcService;
    //private final MemberService memberService;

    @Override
    @Transactional(readOnly = true)
    public MemberProfileResponse getMyProfile(Long userId) {
        Member member = getMemberByUserIdOrThrow(userId);
        return mapToProfileResponse(member);
    }

    @Override
    public MemberSummaryResponse getMemberProfile(Long userId) {
        Member member = getMemberByUserIdOrThrow(userId);
        return mapToMemberSummaryResponse(member);
    }

    @Override
    @Transactional
    public MemberProfileResponse updateMyProfile(Long userId, UpdateMemberProfileRequest request) {
        Member member = getMemberByUserIdOrThrow(userId);

        // Aktualizacja tylko dozwolonych pól (null-safe)
        if (request.getHeight() != null) member.setHeight(request.getHeight());
        if (request.getWeight() != null) member.setWeight(request.getWeight());
        if (request.getPhoneNumber() != null) member.setPhoneNumber(request.getPhoneNumber());

        Member saved = memberRepository.save(member);
        grpcService.grantRoles(userId,UserRole.ROLE_MEMBER);
        log.info("USER_EVENT: Profile updated for user {}", userId);
        return mapToProfileResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MemberSearchResponse searchMembers(String query, Pageable pageable) {
        // Business Rule: Puste zapytanie nie zwraca danych (ochrona przed scrapingiem)
        if (query == null || query.isBlank()) {
            return MemberSearchResponse.builder()
                    .searchedQuery(query)
                    .content(Collections.emptyList())
                    .pageNumber(0)
                    .totalElements(0)
                    .build();
        }

        // Używamy metody z repozytorium (searchByQuery)
        Page<Member> memberPage = memberRepository.searchByQuery(query, pageable);

        List<MemberSummaryResponse> content = memberPage.stream()
                .map(m -> MemberSummaryResponse.builder()
                        .id(m.getId())
                        .firstName(m.getFirstName())
                        .lastName(m.getLastName())
                        .age(calculateAge(m.getBirthDate())) // Wyliczamy wiek zamiast wysyłać datę
                        .build())
                .collect(Collectors.toList());

        return MemberSearchResponse.builder()
                .searchedQuery(query)
                .pageNumber(memberPage.getNumber())
                .pageSize(memberPage.getSize())
                .totalElements(memberPage.getTotalElements())
                .totalPages(memberPage.getTotalPages())
                .content(content)
                .build();
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> addMember(NewMemberRequestDTO request, Long userId) {

        if(memberRepository.existsByUserId(userId)) {
            log.error("USER_EVENT: Member already exists for user {}", userId);
            return ResponseEntity.badRequest().build();
        }
        try{
            memberRepository.save(Member.builder()
                    .birthDate(request.getBirthDate())
                    .pesel(request.getPesel())
                    .phoneNumber(request.getPhoneNumber())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .userId(userId)
                    .build());
           IdentityGrpcClient.RoleGrantResult response =  grpcService.grantRoles(userId,UserRole.ROLE_MEMBER);
            if(response.status() != IdentityGrpcClient.RoleAssignmentStatusDTO.SUCCESS){
                throw new RoleAssigmentExceptions("Problem was occurred while removing role from user : " + userId);
            }
            log.info("USER_EVENT: Member added for user {}", userId);
            log.info("USER_EVENT: ROLE_MEMBER added for user {}", userId);
            return ResponseEntity.ok(Boolean.TRUE);
        }catch (DataIntegrityViolationException e){
            log.error("User already exists for user {}", userId);
            throw new MemberAlreadyExistExceptions("Member already exists : "+ e.getMessage());
        }

    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> removeMember(Long userId) {
      if(!memberRepository.existsByUserId(userId)) {
          log.error("USER_EVENT: Member not found for user {}", userId);
          return new ResponseEntity<>(Boolean.FALSE,HttpStatus.NOT_FOUND);
      }
      IdentityGrpcClient.RoleRemoveResult response =  grpcService.removeRoles(userId,UserRole.ROLE_MEMBER);
        if(response.status() != IdentityGrpcClient.RoleAssignmentStatusDTO.SUCCESS){
            throw new RoleAssigmentExceptions("Problem was occurred while removing role from user : " +userId);
        }
      memberRepository.deleteById(userId);
      return ResponseEntity.ok(Boolean.TRUE);
    }

    private Member getMemberByUserIdOrThrow(Long userId) {
        return memberRepository.findByUserId(userId)
                .orElseThrow(() -> new MemberNotFoundException("User ID: " + userId));
    }

    private MemberProfileResponse mapToProfileResponse(Member member) {
        return MemberProfileResponse.builder()
                .id(member.getId())
                .firstName(member.getFirstName())
                .lastName(member.getLastName())
                .maskedPesel(maskPesel(member.getPesel())) // Maskowanie danych wrażliwych
                .birthDate(member.getBirthDate())
                .phoneNumber(member.getPhoneNumber())
                .height(member.getHeight())
                .weight(member.getWeight())
                .age(calculateAge(member.getBirthDate()))
                .build();
    }

    private String maskPesel(String pesel) {
        if (pesel == null || pesel.length() < 11) return "***********";
        return pesel.substring(0, 2) + "*******" + pesel.substring(9);
    }

    private Integer calculateAge(LocalDate birthDate) {
        if (birthDate == null) return 0;
        return (int) ChronoUnit.YEARS.between(LocalDate.now(), birthDate);
    }

    private MemberSummaryResponse mapToMemberSummaryResponse(Member member) {
       return MemberSummaryResponse.builder()
                .id(member.getId())
                .firstName(member.getFirstName())
                .lastName(member.getLastName())
                .age(calculateAge(member.getBirthDate()))
                .build();
    }
}