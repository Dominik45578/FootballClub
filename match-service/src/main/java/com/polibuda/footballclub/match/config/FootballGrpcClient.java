package com.polibuda.footballclub.match.config;

import com.polibuda.footballclub.football_external_data.grpc.FootballDataServiceGrpc;
import com.polibuda.footballclub.football_external_data.grpc.GetAllTeamsRequest;
import com.polibuda.footballclub.football_external_data.grpc.GetTeamDetailsRequest;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.service.FootballGrpcMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Klient gRPC dla komunikacji z serwisem football-external-data.
 * Odpowiedzialny za niskopoziomowe wywołanie stuba i mapowanie wyników.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FootballGrpcClient {

    // Wstrzykujemy gotowego stuba z Configu
    private final FootballDataServiceGrpc.FootballDataServiceBlockingStub blockingStub;
    private final FootballGrpcMapper mapper;

    /**
     * Pobiera listę wszystkich drużyn.
     */
    public List<TeamBasicResponseDTO> getAllTeams() {
        log.debug("Calling gRPC: GetAllTeams");
        
        var request = GetAllTeamsRequest.getDefaultInstance();
        var response = blockingStub.getAllTeams(request);

        return response.getTeamsList().stream()
                .map(mapper::mapToBasicDto)
                .collect(Collectors.toList());
    }

    /**
     * Pobiera szczegóły konkretnej drużyny (stadion, skład).
     */
    public TeamDetailsResponseDTO getTeamDetails(Long teamId) {
        log.debug("Calling gRPC: GetTeamDetails for ID: {}", teamId);

        var request = GetTeamDetailsRequest.newBuilder()
                .setTeamId(teamId)
                .build();

        var response = blockingStub.getTeamDetails(request);

        return mapper.mapToDetailsDto(response);
    }
}