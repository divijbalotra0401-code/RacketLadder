package dev.racket.model;

import jakarta.persistence.*;

@Entity
public class League {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @ManyToOne
    private AppUser owner;

    public League() {}
    public League(String name) { this.name = name; }
    public League(String name, AppUser owner) { this.name = name; this.owner = owner; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public AppUser getOwner() { return owner; }
    public void setName(String name) { this.name = name; }
    public void setOwner(AppUser owner) { this.owner = owner; }
}
