package dev.racket.controller;

import dev.racket.model.AppUser;
import dev.racket.model.AuthToken;
import dev.racket.repo.AppUserRepository;
import dev.racket.repo.AuthTokenRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${CORS_ORIGIN:*}")
public class AuthController {
    private final AppUserRepository userRepo;
    private final AuthTokenRepository tokenRepo;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Simple in-memory rate limiter: max 10 auth attempts per IP per 15 minutes
    private final ConcurrentHashMap<String, AtomicInteger> attemptCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> windowStart = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 15 * 60 * 1000;

    public AuthController(AppUserRepository userRepo, AuthTokenRepository tokenRepo) {
        this.userRepo = userRepo;
        this.tokenRepo = tokenRepo;
    }

    private boolean isRateLimited(String ip) {
        long now = System.currentTimeMillis();
        windowStart.putIfAbsent(ip, now);
        attemptCounts.putIfAbsent(ip, new AtomicInteger(0));

        if (now - windowStart.get(ip) > WINDOW_MS) {
            windowStart.put(ip, now);
            attemptCounts.put(ip, new AtomicInteger(0));
        }

        return attemptCounts.get(ip).incrementAndGet() > MAX_ATTEMPTS;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body,
                                      @RequestHeader(value = "X-Forwarded-For", defaultValue = "unknown") String ip) {
        if (isRateLimited(ip)) {
            return ResponseEntity.status(429).body(Map.of("error", "Too many attempts. Try again in 15 minutes."));
        }

        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
        }

        username = username.trim().toLowerCase();

        if (userRepo.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
        }

        AppUser user = new AppUser(username, passwordEncoder.encode(password));
        userRepo.save(user);

        return ResponseEntity.ok(buildTokenResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body,
                                   @RequestHeader(value = "X-Forwarded-For", defaultValue = "unknown") String ip) {
        if (isRateLimited(ip)) {
            return ResponseEntity.status(429).body(Map.of("error", "Too many attempts. Try again in 15 minutes."));
        }

        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
        }

        username = username.trim().toLowerCase();
        Optional<AppUser> optUser = userRepo.findByUsername(username);
        if (optUser.isEmpty() || !passwordEncoder.matches(password, optUser.get().getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }

        return ResponseEntity.ok(buildTokenResponse(optUser.get()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String tokenStr = authHeader.substring(7).trim();
            tokenRepo.findByToken(tokenStr).ifPresent(tokenRepo::delete);
        }
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AppUser user = resolveUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        return ResponseEntity.ok(result);
    }

    public AppUser resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String tokenStr = authHeader.substring(7).trim();
        Optional<AuthToken> opt = tokenRepo.findByToken(tokenStr);
        if (opt.isEmpty() || opt.get().isExpired()) return null;
        return opt.get().getUser();
    }

    private Map<String, Object> buildTokenResponse(AppUser user) {
        String tokenStr = UUID.randomUUID().toString();
        tokenRepo.save(new AuthToken(tokenStr, user));
        // Clean up expired tokens for this user
        tokenRepo.deleteExpiredForUser(user.getId(), OffsetDateTime.now());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", tokenStr);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        return result;
    }
}
