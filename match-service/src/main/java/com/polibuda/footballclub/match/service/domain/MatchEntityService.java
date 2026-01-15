package com.polibuda.footballclub.match.service.domain;

import com.polibuda.footballclub.match.MatchStatus;
import com.polibuda.footballclub.match.entity.Match;
import com.polibuda.footballclub.match.exceptions.ResourceNotFoundException;
import com.polibuda.footballclub.match.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchEntityService {

    private final MatchRepository matchRepository;

    @Transactional
    public Match save(Match match) {
        return matchRepository.save(match);
    }

    @Transactional(readOnly = true)
    public Match getById(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Page<Match> getAllByInternalTeamId(Long internalTeamId, Pageable pageable) {
        return matchRepository.findAllByInternalTeamId(internalTeamId, pageable);
    }

    @Transactional(readOnly = true)
    public List<Match> getAllByExternalTeamId(Long externalTeamId) {
        return matchRepository.findAllByExternalTeamId(externalTeamId);
    }

    @Transactional(readOnly = true)
    public Page<Match> getAllByInternalTeamIdIn(Collection<Long> internalTeamIds, Pageable pageable) {
        if (internalTeamIds == null || internalTeamIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return matchRepository.findAllByInternalTeamIdIn(internalTeamIds, pageable);
    }

    @Transactional(readOnly = true)
    public List<Match> getUpcomingMatches(Long internalTeamId) {
        return matchRepository.findUpcomingMatches(internalTeamId, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<Match> getUpcomingMatchesForTeams(Collection<Long> internalTeamIds) {
        if (internalTeamIds == null || internalTeamIds.isEmpty()) {
            return List.of();
        }
        return matchRepository.findUpcomingMatchesForTeams(internalTeamIds, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public Page<Match> getHistoryByStatusAndTeam(MatchStatus status, Long internalTeamId, Pageable pageable) {
        return matchRepository.findAllByStatusAndInternalTeamId(status, internalTeamId, pageable);
    }

    @Transactional(readOnly = true)
    public boolean isTermTaken(Long internalTeamId, LocalDateTime matchDate) {
        LocalDateTime start = matchDate.minusHours(2);
        LocalDateTime end = matchDate.plusHours(2);
        return matchRepository.existsByInternalTeamIdAndMatchDateBetween(internalTeamId, start, end);
    }

    @Transactional
    public void delete(Long id) {
        if (!matchRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cannot delete. Match not found with id: " + id);
        }
        matchRepository.deleteById(id);
    }
}