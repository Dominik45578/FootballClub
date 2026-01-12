package com.polibuda.footballclub.match.controller;

import com.polibuda.footballclub.match.config.FootballGrpcClient;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
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
}
