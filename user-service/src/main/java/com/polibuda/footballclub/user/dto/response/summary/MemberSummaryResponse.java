package com.polibuda.footballclub.user.dto.response.summary;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
public class MemberSummaryResponse implements AbstractSummaryResponse{
    private Long id;
    private String firstName;
    private String lastName;
    private Integer age; // Zamiast daty urodzenia
    private Instant joinDate;
    // Brak PESEL, brak telefonu
}