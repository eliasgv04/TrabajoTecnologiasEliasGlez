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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import edu.uclm.esi.gramola.entities.User;
import edu.uclm.esi.gramola.services.RegisterResult;
import edu.uclm.esi.gramola.services.UserService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping(path = "/register", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(HttpSession session, @RequestBody Map<String, String> body) {
        try {
            String email = body.getOrDefault("email", "").trim();
            String pwd1 = body.getOrDefault("pwd1", "").trim();
            String pwd2 = body.getOrDefault("pwd2", "").trim();
            RegisterResult res = userService.register(email, pwd1, pwd2);
            // Auto-login after registration (session auth)
            session.setAttribute("userId", res.id());
            log.info("Registro correcto");
            return Map.of("message", "Registro correcto");
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (DataIntegrityViolationException e) {
            // Assume duplicate email for better UX; adjust if needed
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese correo electrónico ya está siendo utilizado");
        }
    }

    @PutMapping(path = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> login(HttpSession session, @RequestBody Map<String, Object> info) {
        String email = (info.getOrDefault("email", "") + "").trim();
        String pwd = (info.getOrDefault("pwd", "") + "").trim();
        User user = this.userService.loginByEmail(email, pwd);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Credenciales inválidas");
        }
    session.setAttribute("userId", user.getId());
    log.info("Login correcto");
        return Map.of("message", "Login correcto");
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
}
