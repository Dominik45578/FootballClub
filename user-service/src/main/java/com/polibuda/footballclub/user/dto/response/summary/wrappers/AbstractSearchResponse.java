package com.polibuda.footballclub.user.dto.response.summary.wrappers;

import com.polibuda.footballclub.user.dto.response.summary.AbstractSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.util.List;

@Data
@SuperBuilder // Kluczowe dla dziedziczenia w Lomboku!
@NoArgsConstructor
@AllArgsConstructor
// Definiujemy T tutaj, ograniczając, że musi dziedziczyć po Twoim AbstractSummaryResponse
public abstract class AbstractSearchResponse<T extends AbstractSummaryResponse> { // Możesz dodać <T extends AbstractSummaryResponse> dla bezpieczeństwa

    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private List<T> content;
}