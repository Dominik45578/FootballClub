package com.polibuda.footballclub.football_external_data.controller;

import com.polibuda.footballclub.football_external_data.dto.clubs.TeamSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.football_external_data.grpc.GetAllTeamsRequest;
import com.polibuda.footballclub.football_external_data.grpc.GetAllTeamsResponse;
import com.polibuda.footballclub.football_external_data.grpc.GetTeamDetailsRequest;
import com.polibuda.footballclub.football_external_data.grpc.GetTeamDetailsResponse;
import com.polibuda.footballclub.football_external_data.service.FootballFacadeService;
import com.polibuda.footballclub.football_external_data.grpc.FootballDataServiceGrpc.FootballDataServiceImplBase;
import com.polibuda.footballclub.football_external_data.service.FootballProtoMapper;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service // Ważne: to musi być Bean, żeby GrpcServerConfig go wykrył
@RequiredArgsConstructor
public class GrpcFootballController extends FootballDataServiceImplBase {

    private final FootballFacadeService footballFacadeService;
    private final FootballProtoMapper mapper;

    @Override
    public void getAllTeams(GetAllTeamsRequest request, StreamObserver<GetAllTeamsResponse> responseObserver) {
        log.info("gRPC: Received getAllTeams request");
        try {
            // 1. Pobranie danych z serwisu domenowego
            List<TeamSummaryDataDTO> teams = footballFacadeService.getAllTeams();

            // 2. Budowanie odpowiedzi
            var responseBuilder = GetAllTeamsResponse.newBuilder();
            
            teams.stream()
                 .map(mapper::toSummaryProto)
                 .forEach(responseBuilder::addTeams);

            // 3. Wysłanie odpowiedzi i zamknięcie strumienia
            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error processing getAllTeams", e);
            responseObserver.onError(Status.INTERNAL
                    .withDescription("Internal server error")
                    .withCause(e)
                    .asRuntimeException());
        }
    }

    @Override
    public void getTeamDetails(GetTeamDetailsRequest request, StreamObserver<GetTeamDetailsResponse> responseObserver) {
        long teamId = request.getTeamId();
        log.info("gRPC: Received getTeamDetails request for ID: {}", teamId);

        try {
            // 1. Pobranie danych
            TeamDetailsResponseDTO teamDetails = footballFacadeService.getTeamDetails(teamId);

            // Obsługa przypadku null (jeśli facade zwraca null zamiast rzucać wyjątek)
            if (teamDetails == null) {
                responseObserver.onError(Status.NOT_FOUND
                        .withDescription("Team with ID " + teamId + " not found")
                        .asRuntimeException());
                return;
            }

            // 2. Mapowanie i wysyłka
            GetTeamDetailsResponse response = mapper.toDetailsResponse(teamDetails);
            
            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            // Możemy tu dodać logikę rozpoznawania konkretnych wyjątków (np. EntityNotFoundException -> NOT_FOUND)
            log.error("Error processing getTeamDetails for ID: " + teamId, e);
            
            // Domyślny fallback na INTERNAL error
            responseObserver.onError(Status.INTERNAL
                    .withDescription("Error fetching team details")
                    .withCause(e)
                    .asRuntimeException());
        }
    }
}