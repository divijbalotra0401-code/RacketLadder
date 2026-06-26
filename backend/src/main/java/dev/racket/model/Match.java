package dev.racket.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
public class Match {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private League league;

    @ManyToOne
    private Player playerA;

    @ManyToOne
    private Player playerB;

    @ManyToOne
    private Player playerC;

    @ManyToOne
    private Player playerD;

    @ManyToOne
    private Player winner;

    private String competitionType;

    private String score;

    private OffsetDateTime playedAt;

    public Match() {}
    public Long getId() { return id; }
    public League getLeague() { return league; }
    public Player getPlayerA() { return playerA; }
    public Player getPlayerB() { return playerB; }
    public Player getPlayerC() { return playerC; }
    public Player getPlayerD() { return playerD; }
    public Player getWinner() { return winner; }
    public String getCompetitionType() { return competitionType; }
    public String getScore() { return score; }
    public OffsetDateTime getPlayedAt() { return playedAt; }
    public void setLeague(League league) { this.league = league; }
    public void setPlayerA(Player p) { this.playerA = p; }
    public void setPlayerB(Player p) { this.playerB = p; }
    public void setPlayerC(Player p) { this.playerC = p; }
    public void setPlayerD(Player p) { this.playerD = p; }
    public void setWinner(Player p) { this.winner = p; }
    public void setCompetitionType(String s) { this.competitionType = s; }
    public void setScore(String s) { this.score = s; }
    public void setPlayedAt(OffsetDateTime t) { this.playedAt = t; }
}
