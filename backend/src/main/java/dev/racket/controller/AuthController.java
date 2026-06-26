package dev.racket.controller;

import dev.racket.model.AppUser;
import dev.racket.model.AuthToken;
import dev.racket.repo.AppUserRepository;
import dev.racket.repo.AuthTokenRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AppUserRepository userRepo;
    private final AuthTokenRepository tokenRepo;

    public AuthController(AppUserRepository userRepo, AuthTokenRepository tokenRepo) {
        this.userRepo = userRepo;
        this.tokenRepo = tokenRepo;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
        }

        username = username.trim().toLowerCase();

        if (userRepo.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
        }

        String hash = hashPassword(password);
        AppUser user = new AppUser(username, hash);
        userRepo.save(user);

        String tokenStr = UUID.randomUUID().toString();
        AuthToken token = new AuthToken(tokenStr, user);
        tokenRepo.save(token);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", tokenStr);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
        }

        username = username.trim().toLowerCase();
        Optional<AppUser> optUser = userRepo.findByUsername(username);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }

        AppUser user = optUser.get();
        if (!hashPassword(password).equals(user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }

        String tokenStr = UUID.randomUUID().toString();
        AuthToken token = new AuthToken(tokenStr, user);
        tokenRepo.save(token);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", tokenStr);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        return ResponseEntity.ok(result);
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
        return opt.map(AuthToken::getUser).orElse(null);
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            // Simple salt for demo purposes
            String salted = "racket_salt_" + password;
            byte[] digest = md.digest(salted.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
