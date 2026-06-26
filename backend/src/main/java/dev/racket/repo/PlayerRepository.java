package dev.racket.repo;

import dev.racket.model.Player;
import dev.racket.model.League;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByLeague(League league);
}
