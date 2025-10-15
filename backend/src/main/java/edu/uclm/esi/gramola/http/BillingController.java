package edu.uclm.esi.gramola.http;

import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.entities.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@RestController
@RequestMapping("/billing")
public class BillingController {
    private final UserRepository users;

    @Value("${app.pricePerSong:1}")
    private int pricePerSong;

    public BillingController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/price")
    public Map<String, Integer> price() {
        return Map.of("pricePerSong", pricePerSong);
    }

    @GetMapping("/balance")
    public ResponseEntity<?> balance(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("Sesión no iniciada");
        User u = users.findById(userId).orElse(null);
        if (u == null) return ResponseEntity.status(404).body("Usuario no encontrado");
        return ResponseEntity.ok(Map.of("coins", u.getCoins()));
    }

    @PostMapping("/recharge")
    public ResponseEntity<?> recharge(HttpSession session, @RequestBody Map<String, Integer> body) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("Sesión no iniciada");
        int amount = Math.max(0, body.getOrDefault("amount", 0));
        if (amount <= 0) return ResponseEntity.badRequest().body("Cantidad inválida");
        User u = users.findById(userId).orElse(null);
        if (u == null) return ResponseEntity.status(404).body("Usuario no encontrado");
        u.setCoins(u.getCoins() + amount);
        users.save(u);
        return ResponseEntity.ok(Map.of("coins", u.getCoins()));
    }
}
