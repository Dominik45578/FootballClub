package com.polibuda.footballclub.user.dto.response.summary;

import com.polibuda.footballclub.user.dto.response.restricted.TeamMemberListItemDto;
import com.polibuda.footballclub.user.entity.Team;
import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class MemberSummaryResponse implements AbstractSummaryResponse{
    private Long id;
    private String firstName;
    private String lastName;
    private Integer age; // Zamiast daty urodzenia
    private Instant joinDate;
    private double weight;
    private double height;
}