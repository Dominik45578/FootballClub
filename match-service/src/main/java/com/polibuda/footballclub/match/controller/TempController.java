package com.polibuda.footballclub.match.controller;

import com.polibuda.footballclub.match.config.FootballGrpcClient;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

//Nie mapuj do fronta!!!!!!!!!!!
@RestController
@RequestMapping("match/temp/")
@AllArgsConstructor
public class TempController {
    private final FootballGrpcClient client;
    @GetMapping
    List<TeamBasicResponseDTO> getAllTeams(){
        return client.getAllTeams();
    }

    @GetMapping("{id}")
    TeamDetailsResponseDTO getTeamById(@PathVariable Long id){
        return client.getTeamDetails(id);
    }
}
