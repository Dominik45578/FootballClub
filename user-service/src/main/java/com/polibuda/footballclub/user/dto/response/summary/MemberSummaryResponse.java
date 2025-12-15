package com.polibuda.footballclub.user.dto.response.summary;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;

@Data
@Builder
public class MemberSummaryResponse implements AbstractSummaryResponse{
    private Long id;
    private String firstName;
    private String lastName;
    private Integer age; // Zamiast daty urodzenia
    // Brak PESEL, brak telefonu
}