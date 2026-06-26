package dev.racket.controller;

import dev.racket.model.AppUser;
import dev.racket.model.League;
import dev.racket.model.Match;
import dev.racket.model.Player;
import dev.racket.repo.LeagueRepository;
import dev.racket.repo.MatchRepository;
import dev.racket.repo.PlayerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {
    private final LeagueRepository leagueRepo;
    private final PlayerRepository playerRepo;
    private final MatchRepository matchRepo;
    private final AuthController authController;

    public ApiController(LeagueRepository leagueRepo, PlayerRepository playerRepo,
                         MatchRepository matchRepo, AuthController authController) {
        this.leagueRepo = leagueRepo;
        this.playerRepo = playerRepo;
        this.matchRepo = matchRepo;
        this.authController = authController;
    }

    private AppUser resolveUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        return authController.resolveUser(authHeader);
    }

    @PostMapping("/leagues")
    public ResponseEntity<?> createLeague(@RequestBody Map<String, String> body, HttpServletRequest request) {
        AppUser user = resolveUser(request);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));

        String name = body.getOrDefault("name", "Untitled League");
        League league = new League(name, user);
        return ResponseEntity.ok(leagueRepo.save(league));
    }

    @PostMapping("/players")
    public ResponseEntity<?> addPlayer(@RequestBody Map<String, String> body, HttpServletRequest request) {
        AppUser user = resolveUser(request);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));

        String name = body.get("name");
        Long leagueId = body.containsKey("leagueId") ? Long.valueOf(body.get("leagueId")) : null;
        if (name == null || leagueId == null) return ResponseEntity.badRequest().body("name and leagueId required");
        Optional<League> league = leagueRepo.findById(leagueId);
        if (league.isEmpty()) return ResponseEntity.notFound().build();

        // Only the league owner can add players
        if (league.get().getOwner() == null || !league.get().getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only the league owner can add players"));
        }

        Player p = new Player(name, league.get());
        return ResponseEntity.ok(playerRepo.save(p));
    }

    @PostMapping("/matches")
    public ResponseEntity<?> recordMatch(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AppUser user = resolveUser(request);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));

        Long leagueId = getLong(body, "leagueId");
        String competitionType = body.containsKey("competitionType") ? String.valueOf(body.get("competitionType")) : "SINGLES";
        
        Long playerAId = getLong(body, "playerAId");
        Long playerBId = getLong(body, "playerBId");
        Long playerCId = getLong(body, "playerCId");
        Long playerDId = getLong(body, "playerDId");
        Long winnerId = getLong(body, "winnerId");
        String score = body.containsKey("score") && body.get("score") != null ? String.valueOf(body.get("score")) : null;

        if (leagueId == null || playerAId == null || winnerId == null) {
            return ResponseEntity.badRequest().body("leagueId, playerAId, and winnerId are required");
        }

        Optional<League> league = leagueRepo.findById(leagueId);
        if (league.isEmpty()) return ResponseEntity.notFound().build();

        // Only the league owner can record matches
        if (league.get().getOwner() == null || !league.get().getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only the league owner can record matches"));
        }

        Match m = new Match();
        m.setLeague(league.get());
        m.setCompetitionType(competitionType);

        Optional<Player> a = playerRepo.findById(playerAId);
        if (a.isEmpty()) return ResponseEntity.badRequest().body("Player A not found");
        m.setPlayerA(a.get());

        if ("DOUBLES".equalsIgnoreCase(competitionType)) {
            if (playerBId == null || playerCId == null || playerDId == null) {
                return ResponseEntity.badRequest().body("All 4 players are required for doubles");
            }
            Optional<Player> b = playerRepo.findById(playerBId);
            Optional<Player> c = playerRepo.findById(playerCId);
            Optional<Player> d = playerRepo.findById(playerDId);
            if (b.isEmpty() || c.isEmpty() || d.isEmpty()) {
                return ResponseEntity.badRequest().body("One or more players not found");
            }
            m.setPlayerB(b.get());
            m.setPlayerC(c.get());
            m.setPlayerD(d.get());
        } else {
            if (playerBId == null) {
                return ResponseEntity.badRequest().body("Opponent (Player B) is required for singles");
            }
            Optional<Player> b = playerRepo.findById(playerBId);
            if (b.isEmpty()) return ResponseEntity.badRequest().body("Player B not found");
            m.setPlayerB(b.get());
        }

        Optional<Player> w = playerRepo.findById(winnerId);
        if (w.isEmpty()) return ResponseEntity.badRequest().body("Winner not found");
        m.setWinner(w.get());

        m.setScore(score);
        m.setPlayedAt(OffsetDateTime.now());
        return ResponseEntity.ok(matchRepo.save(m));
    }

    // Read endpoints — no auth required
    @GetMapping("/leagues/{id}/matches")
    public ResponseEntity<?> getMatches(@PathVariable Long id) {
        Optional<League> l = leagueRepo.findById(id);
        if (l.isEmpty()) return ResponseEntity.notFound().build();
        List<Match> matches = matchRepo.findByLeagueOrderByPlayedAtDesc(l.get());
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/leagues/{id}/leaderboard")
    public ResponseEntity<?> leaderboard(@PathVariable Long id) {
        Optional<League> l = leagueRepo.findById(id);
        if (l.isEmpty()) return ResponseEntity.notFound().build();
        List<Player> players = playerRepo.findByLeague(l.get());
        List<Match> matches = matchRepo.findByLeagueOrderByPlayedAtDesc(l.get());

        Map<Long, Integer> wins = new HashMap<>();
        Map<Long, Integer> losses = new HashMap<>();
        for (Player p : players) { wins.put(p.getId(), 0); losses.put(p.getId(), 0); }
        for (Match m : matches) {
            String type = m.getCompetitionType();
            if ("DOUBLES".equalsIgnoreCase(type)) {
                Long waId = m.getPlayerA() != null ? m.getPlayerA().getId() : null;
                Long wbId = m.getPlayerB() != null ? m.getPlayerB().getId() : null;
                Long wcId = m.getPlayerC() != null ? m.getPlayerC().getId() : null;
                Long wdId = m.getPlayerD() != null ? m.getPlayerD().getId() : null;
                Long winnerId = m.getWinner() != null ? m.getWinner().getId() : null;

                if (winnerId != null) {
                    boolean side1Won = Objects.equals(winnerId, waId) || Objects.equals(winnerId, wbId);
                    if (side1Won) {
                        if (waId != null) wins.put(waId, wins.getOrDefault(waId, 0) + 1);
                        if (wbId != null) wins.put(wbId, wins.getOrDefault(wbId, 0) + 1);
                        if (wcId != null) losses.put(wcId, losses.getOrDefault(wcId, 0) + 1);
                        if (wdId != null) losses.put(wdId, losses.getOrDefault(wdId, 0) + 1);
                    } else {
                        if (wcId != null) wins.put(wcId, wins.getOrDefault(wcId, 0) + 1);
                        if (wdId != null) wins.put(wdId, wins.getOrDefault(wdId, 0) + 1);
                        if (waId != null) losses.put(waId, losses.getOrDefault(waId, 0) + 1);
                        if (wbId != null) losses.put(wbId, losses.getOrDefault(wbId, 0) + 1);
                    }
                }
            } else {
                if (m.getWinner() != null && m.getPlayerA() != null && m.getPlayerB() != null) {
                    Long wid = m.getWinner().getId();
                    wins.put(wid, wins.getOrDefault(wid, 0) + 1);
                    Long a = m.getPlayerA().getId();
                    Long b = m.getPlayerB().getId();
                    if (!Objects.equals(wid, a)) losses.put(a, losses.getOrDefault(a, 0) + 1);
                    if (!Objects.equals(wid, b)) losses.put(b, losses.getOrDefault(b, 0) + 1);
                }
            }
        }

        List<Map<String,Object>> board = players.stream()
            .map(p -> {
                Map<String,Object> entry = new HashMap<>();
                entry.put("playerId", p.getId());
                entry.put("name", p.getName());
                entry.put("wins", wins.getOrDefault(p.getId(),0));
                entry.put("losses", losses.getOrDefault(p.getId(),0));
                return entry;
            })
            .sorted((a,b)-> Integer.compare((Integer)b.get("wins"),(Integer)a.get("wins")))
            .collect(Collectors.toList());

        return ResponseEntity.ok(board);
    }

    @GetMapping("/leaderboard/global")
    public ResponseEntity<?> globalLeaderboard() {
        List<Player> allPlayers = playerRepo.findAll();
        List<Match> allMatches = matchRepo.findAll();

        Map<Long, Integer> wins = new HashMap<>();
        Map<Long, Integer> losses = new HashMap<>();
        for (Player p : allPlayers) { wins.put(p.getId(), 0); losses.put(p.getId(), 0); }

        for (Match m : allMatches) {
            String type = m.getCompetitionType();
            if ("DOUBLES".equalsIgnoreCase(type)) {
                Long waId = m.getPlayerA() != null ? m.getPlayerA().getId() : null;
                Long wbId = m.getPlayerB() != null ? m.getPlayerB().getId() : null;
                Long wcId = m.getPlayerC() != null ? m.getPlayerC().getId() : null;
                Long wdId = m.getPlayerD() != null ? m.getPlayerD().getId() : null;
                Long winnerId = m.getWinner() != null ? m.getWinner().getId() : null;
                if (winnerId != null) {
                    boolean side1Won = Objects.equals(winnerId, waId) || Objects.equals(winnerId, wbId);
                    if (side1Won) {
                        if (waId != null) wins.put(waId, wins.getOrDefault(waId, 0) + 1);
                        if (wbId != null) wins.put(wbId, wins.getOrDefault(wbId, 0) + 1);
                        if (wcId != null) losses.put(wcId, losses.getOrDefault(wcId, 0) + 1);
                        if (wdId != null) losses.put(wdId, losses.getOrDefault(wdId, 0) + 1);
                    } else {
                        if (wcId != null) wins.put(wcId, wins.getOrDefault(wcId, 0) + 1);
                        if (wdId != null) wins.put(wdId, wins.getOrDefault(wdId, 0) + 1);
                        if (waId != null) losses.put(waId, losses.getOrDefault(waId, 0) + 1);
                        if (wbId != null) losses.put(wbId, losses.getOrDefault(wbId, 0) + 1);
                    }
                }
            } else {
                if (m.getWinner() != null && m.getPlayerA() != null && m.getPlayerB() != null) {
                    Long wid = m.getWinner().getId();
                    wins.put(wid, wins.getOrDefault(wid, 0) + 1);
                    Long a = m.getPlayerA().getId();
                    Long b = m.getPlayerB().getId();
                    if (!Objects.equals(wid, a)) losses.put(a, losses.getOrDefault(a, 0) + 1);
                    if (!Objects.equals(wid, b)) losses.put(b, losses.getOrDefault(b, 0) + 1);
                }
            }
        }

        List<Map<String, Object>> board = allPlayers.stream()
            .filter(p -> wins.getOrDefault(p.getId(), 0) > 0 || losses.getOrDefault(p.getId(), 0) > 0)
            .map(p -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("playerId", p.getId());
                entry.put("name", p.getName());
                entry.put("leagueId", p.getLeague() != null ? p.getLeague().getId() : null);
                entry.put("leagueName", p.getLeague() != null ? p.getLeague().getName() : "Unknown");
                entry.put("wins", wins.getOrDefault(p.getId(), 0));
                entry.put("losses", losses.getOrDefault(p.getId(), 0));
                return entry;
            })
            .sorted((a, b) -> Integer.compare((Integer) b.get("wins"), (Integer) a.get("wins")))
            .collect(Collectors.toList());

        return ResponseEntity.ok(board);
    }

    private Long getLong(Map<String, Object> body, String key) {
        if (!body.containsKey(key) || body.get(key) == null) return null;
        Object val = body.get(key);
        if (val instanceof Number) return ((Number) val).longValue();
        try {
            return Long.valueOf(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
