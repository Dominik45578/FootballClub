package com.polibuda.footballclub.user.dto.response.summary.wrappers;

import com.polibuda.footballclub.user.dto.response.summary.MemberSummaryResponse;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import lombok.NoArgsConstructor;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class MemberSearchResponse extends AbstractSearchResponse<MemberSummaryResponse> {


    private String searchedQuery;
}