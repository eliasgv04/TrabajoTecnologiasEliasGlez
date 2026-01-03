package edu.uclm.esi.gramola.http;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import edu.uclm.esi.gramola.entities.User;
import edu.uclm.esi.gramola.services.SettingsService;
import edu.uclm.esi.gramola.services.UserService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;
    private final SettingsService settingsService;
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    public UserController(UserService userService, SettingsService settingsService) {
        this.userService = userService;
        this.settingsService = settingsService;
    }

    @PostMapping(path = "/register", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(HttpSession session, @RequestBody Map<String, String> body) {
        try {
            String email = body.getOrDefault("email", "").trim();
            String pwd1 = body.getOrDefault("pwd1", "").trim();
            String pwd2 = body.getOrDefault("pwd2", "").trim();
            String barName = body.getOrDefault("barName", "").trim();
            var result = userService.register(email, pwd1, pwd2);
            if (!barName.isBlank()) {
                try { settingsService.updateBarName(result.id(), barName); } catch (Exception ex) { log.warn("No se pudo guardar el nombre del bar en registro", ex); }
            }
            // No auto-login: requerir verificación por email antes de poder iniciar sesión
            log.info("Registro correcto, verificación requerida");
            return Map.of("message", "Registro correcto. Revisa tu correo para verificar la cuenta");
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (DataIntegrityViolationException e) {
            // Assume duplicate email for better UX; adjust if needed
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese correo electrónico ya está siendo utilizado");
        }
    }

    @PutMapping(path = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> login(HttpSession session, @RequestBody Map<String, Object> info) {
        String identifier = (info.getOrDefault("email", "") + "").trim();
        String pwd = (info.getOrDefault("pwd", "") + "").trim();
        var opt = this.userService.findUserByIdentifier(identifier);
        if (opt.isPresent() && !opt.get().isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Tu cuenta no está verificada. Revisa tu correo y haz clic en el enlace de verificación.");
        }
        User user = this.userService.loginByIdentifier(identifier, pwd);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Credenciales inválidas");
        }
    session.setAttribute("userId", user.getId());
    log.info("Login correcto");
        return Map.of("message", "Login correcto", "email", user.getEmail());
    }

    @DeleteMapping(path = "/removeUser", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> removeUser(HttpSession session) {
        Object userId = session.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no iniciada");
        }
    this.userService.removeUser((Long) userId);
        session.invalidate();
    log.info("Cuenta eliminada");
        return Map.of("message", "Cuenta eliminada");
    }

    @PostMapping(path = "/logout", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        log.info("Logout correcto");
        return Map.of("message", "Logout correcto");
    }

    @GetMapping(path = "/verify")
    public ResponseEntity<Void> verify(@RequestParam("token") String token) {
        boolean ok = this.userService.verifyToken(token);
        if (!ok) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o caducado");
        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", "https://localhost:4200/login?verified=1");
        return ResponseEntity.status(302).headers(headers).build();
    }

    @PostMapping(path = "/reset", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> resetByEmail(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim();
        String pwd1 = body.getOrDefault("pwd1", "").trim();
        String pwd2 = body.getOrDefault("pwd2", "").trim();
        if (email.isEmpty() || pwd1.isEmpty() || pwd2.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos obligatorios");
        }
        if (!pwd1.equals(pwd2)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden");
        }
        if (pwd1.length() <= 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos cinco caracteres");
        }
        try {
            boolean ok = this.userService.resetPasswordByEmail(email, pwd1);
            if (!ok) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
            log.info("Contraseña actualizada");
            return Map.of("message", "Contraseña actualizada");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping(path = "/reset/request", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> requestReset(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim();
        if (email.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email obligatorio");
        }
        this.userService.requestPasswordReset(email);
        // No revelar si existe o no
        return Map.of("message", "Si el correo existe, hemos enviado un enlace para restablecer la contraseña");
    }

    @PostMapping(path = "/reset/confirm", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> confirmReset(@RequestBody Map<String, String> body) {
        String token = body.getOrDefault("token", "").trim();
        String pwd1 = body.getOrDefault("pwd1", "").trim();
        String pwd2 = body.getOrDefault("pwd2", "").trim();
        if (token.isEmpty() || pwd1.isEmpty() || pwd2.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos obligatorios");
        }
        try {
            boolean ok = this.userService.resetPasswordByToken(token, pwd1, pwd2);
            if (!ok) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o caducado");
            log.info("Contraseña restablecida por token");
            return Map.of("message", "Contraseña actualizada");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}
