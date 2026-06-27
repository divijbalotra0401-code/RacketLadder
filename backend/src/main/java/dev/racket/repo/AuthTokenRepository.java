package dev.racket.repo;

import dev.racket.model.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    Optional<AuthToken> findByToken(String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM AuthToken t WHERE t.user.id = :userId AND t.expiresAt < :now")
    void deleteExpiredForUser(Long userId, OffsetDateTime now);
}
