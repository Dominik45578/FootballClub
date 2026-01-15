package com.polibuda.footballclub.user.controller;

import com.polibuda.footballclub.match.grpc.*;
import com.polibuda.footballclub.user.exceptions.notFound.ResourceNotFoundException;
import com.polibuda.footballclub.user.mappers.MatchGrpcMapper;
import com.polibuda.footballclub.user.service.MatchDataService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Set;


@Slf4j
@RequiredArgsConstructor
@Service
public class MatchIntegrationGrpcController extends MatchIntegrationServiceGrpc.MatchIntegrationServiceImplBase {

    private final MatchDataService matchDataService;
    private final MatchGrpcMapper mapper;

    @Override
    public void getTeamForMatch(GetTeamForMatchRequest request, StreamObserver<TeamForMatchResponse> responseObserver) {
        log.debug("gRPC: Fetching team details for match service, teamId={}", request.getTeamId());
        try {
            var team = matchDataService.getTeamWithMembers(request.getTeamId());
            var response = mapper.mapToTeamResponse(team);
            
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (ResourceNotFoundException e) {
            log.warn("gRPC: Team not found: {}", request.getTeamId());
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription(e.getMessage())
                    .asRuntimeException());
        } catch (Exception e) {
            log.error("gRPC: Unexpected error fetching team {}", request.getTeamId(), e);
            responseObserver.onError(Status.INTERNAL
                    .withDescription("Internal server error")
                    .asRuntimeException());
        }
    }

    @Override
    public void getTeamMemberForMatch(GetTeamMemberForMatchRequest request, StreamObserver<TeamMemberForMatchResponse> responseObserver) {
        log.debug("gRPC: Fetching team member for match service, id={}", request.getTeamMemberId());
        try {
            var teamMember = matchDataService.getTeamMember(request.getTeamMemberId());
            var response = mapper.mapToTeamMemberResponse(teamMember);

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (ResourceNotFoundException e) {
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription(e.getMessage())
                    .asRuntimeException());
        } catch (Exception e) {
            log.error("gRPC: Unexpected error fetching team member {}", request.getTeamMemberId(), e);
            responseObserver.onError(Status.INTERNAL.asRuntimeException());
        }
    }

    @Override
    public void getPlayerPhysicalProfile(GetPlayerPhysicalProfileRequest request, StreamObserver<PlayerPhysicalProfileResponse> responseObserver) {
        log.debug("gRPC: Fetching physical profile, memberId={}", request.getMemberId());
        try {
            var member = matchDataService.getMemberPhysicalProfile(request.getMemberId());
            var response = mapper.mapToPhysicalProfile(member);

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (ResourceNotFoundException e) {
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription(e.getMessage())
                    .asRuntimeException());
        } catch (Exception e) {
            log.error("gRPC: Unexpected error fetching member profile {}", request.getMemberId(), e);
            responseObserver.onError(Status.INTERNAL.asRuntimeException());
        }
    }

    @Override
    public void getUserTeams(GetUserTeamsRequest request, StreamObserver<GetUserTeamsResponse> responseObserver) {
        log.debug("gRPC: Fetching physical profile, memberId={}", request.getUserId());
        try {
           Set<Long> gathered = matchDataService.getUserTeams(request.getUserId());
            var response = mapper.mapToGetUserTeamsResponse(request.getUserId(),gathered);

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (ResourceNotFoundException e) {
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription(e.getMessage())
                    .asRuntimeException());
        } catch (Exception e) {
            log.error("gRPC: Unexpected error fetching member profile {}", request.getUserId(), e);
            responseObserver.onError(Status.INTERNAL.asRuntimeException());
        }
    }
}