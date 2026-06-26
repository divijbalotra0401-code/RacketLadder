package dev.racket.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
public class AuthToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String token;

    @ManyToOne
    private AppUser user;

    private OffsetDateTime createdAt;

    public AuthToken() {}

    public AuthToken(String token, AppUser user) {
        this.token = token;
        this.user = user;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public AppUser getUser() { return user; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setToken(String token) { this.token = token; }
    public void setUser(AppUser user) { this.user = user; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
