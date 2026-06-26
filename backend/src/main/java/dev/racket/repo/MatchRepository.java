package dev.racket.repo;

import dev.racket.model.Match;
import dev.racket.model.League;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByLeagueOrderByPlayedAtDesc(League league);
}
