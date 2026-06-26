package dev.racket.model;

import jakarta.persistence.*;

@Entity
public class Player {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne
    private League league;

    public Player() {}
    public Player(String name, League league) { this.name = name; this.league = league; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public League getLeague() { return league; }
    public void setName(String name) { this.name = name; }
    public void setLeague(League league) { this.league = league; }
}
