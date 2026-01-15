package com.polibuda.footballclub.match.service;

import com.polibuda.footballclub.match.dto.fromMatchService.MatchMemberDto;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.fromMatchService.PhysicalProfileDto;
import com.polibuda.footballclub.match.exceptions.MatchSerwisExceptions;
import com.polibuda.footballclub.match.exceptions.ResourceNotFoundException;
import com.polibuda.footballclub.match.grpc.*;
import com.polibuda.footballclub.match.mappers.MatchProtoMapper;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchIntegrationClient {

    private final MatchIntegrationServiceGrpc.MatchIntegrationServiceBlockingStub matchStub;
    private final MatchProtoMapper mapper;

    public List<Long> getUserTeams(Long userId) {
        try {
            GetUserTeamsRequest request = GetUserTeamsRequest.newBuilder()
                    .setUserId(userId)
                    .build();

            GetUserTeamsResponse response = matchStub.getUserTeams(request);

            return response.getTeamIdsList(); // Zwraca listę Longów

        } catch (StatusRuntimeException e) {
            handleGrpcError(e, "getUserTeams", userId);
            // W przypadku błędu zwracamy pustą listę, aby nie blokować aplikacji,
            // ale logujemy błąd.
            return Collections.emptyList();
        }
    }


    public Optional<MatchTeamDto> getTeamForMatch(Long teamId) {
        try {
            GetTeamForMatchRequest request = GetTeamForMatchRequest.newBuilder()
                    .setTeamId(teamId)
                    .build();

            TeamForMatchResponse response = matchStub.getTeamForMatch(request);
            return Optional.of(mapper.toDto(response));

        } catch (StatusRuntimeException e) {
            handleGrpcError(e, "getTeamForMatch", teamId);
            return Optional.empty();
        }
    }

    public Optional<MatchMemberDto> getTeamMember(Long teamMemberId) {
        try {
            GetTeamMemberForMatchRequest request = GetTeamMemberForMatchRequest.newBuilder()
                    .setTeamMemberId(teamMemberId)
                    .build();

            TeamMemberForMatchResponse response = matchStub.getTeamMemberForMatch(request);
            return Optional.of(mapper.toDto(response));

        } catch (StatusRuntimeException e) {
            handleGrpcError(e, "getTeamMember", teamMemberId);
            return Optional.empty();
        }
    }

    public Optional<PhysicalProfileDto> getPlayerPhysicalProfile(Long memberId) {
        try {
            GetPlayerPhysicalProfileRequest request = GetPlayerPhysicalProfileRequest.newBuilder()
                    .setMemberId(memberId)
                    .build();

            PlayerPhysicalProfileResponse response = matchStub.getPlayerPhysicalProfile(request);
            return Optional.of(mapper.toDto(response));

        } catch (StatusRuntimeException e) {
            handleGrpcError(e, "getPlayerPhysicalProfile", memberId);
            return Optional.empty();
        }
    }

    private void handleGrpcError(StatusRuntimeException e, String action, Long id) {
        if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
            log.warn("Resource not found via gRPC [action={}, id={}]: {}", action, id, e.getMessage());
            throw new ResourceNotFoundException(action+id);
        } else {
            log.error("gRPC call failed [action={}, id={}]: {}", action, id, e.getMessage(), e);
            throw new MatchSerwisExceptions("gRPC call failed [action="+action+", id="+id+"]");
        }
    }
}