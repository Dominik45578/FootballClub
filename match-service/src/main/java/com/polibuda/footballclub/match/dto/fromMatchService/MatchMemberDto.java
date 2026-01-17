package com.polibuda.footballclub.match.dto.fromMatchService;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
public class MatchMemberDto {
    private Long teamMemberId;
    private Long memberId;
    private String firstName;
    private String lastName;
    private String status;
    private Set<String> roles;
    private String fieldPosition;
    private String logoUrl;
    private int number;
}