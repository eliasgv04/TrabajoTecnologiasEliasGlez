package edu.uclm.esi.gramola.http;

import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.dao.UserSubscriptionRepository;
import edu.uclm.esi.gramola.entities.User;
import edu.uclm.esi.gramola.entities.UserSubscription;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/account")
public class AccountController {
    private final UserRepository users;
    private final UserSubscriptionRepository subsRepo;

    public AccountController(UserRepository users, UserSubscriptionRepository subsRepo) {
        this.users = users;
        this.subsRepo = subsRepo;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> me(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debes iniciar sesión");
        Long userId = (Long) userIdObj;
        User u = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        var now = LocalDateTime.now();
    var lastActive = subsRepo
        .findFirstByUserIdAndStatusOrderByEndAtDesc(userId, UserSubscription.Status.ACTIVE)
        .orElse(null);
    boolean active = lastActive != null && lastActive.getEndAt() != null && lastActive.getEndAt().isAfter(now);
    String activeUntil = (lastActive != null && lastActive.getEndAt() != null) ? lastActive.getEndAt().toString() : null;
        return Map.of(
                "email", u.getEmail(),
                "active", active,
                "activeUntil", activeUntil
        );
    }
}
