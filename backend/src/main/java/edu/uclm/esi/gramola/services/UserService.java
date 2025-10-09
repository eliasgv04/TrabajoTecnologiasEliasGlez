package edu.uclm.esi.gramola.services;

import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.entities.User;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_REGEX = Pattern.compile("^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$");

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegisterResult register(String email, String pwd1, String pwd2) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El correo suministrado no tiene un formato válido");
        }
        email = email.trim();
        if (!EMAIL_REGEX.matcher(email).matches()) {
            throw new IllegalArgumentException("El correo suministrado no tiene un formato válido");
        }
        if (pwd1 == null || pwd2 == null) {
            throw new IllegalArgumentException("La contraseña debe tener al menos cinco caracteres");
        }
        pwd1 = pwd1.trim();
        pwd2 = pwd2.trim();
        if (!pwd1.equals(pwd2)) {
            throw new IllegalArgumentException("La contraseña y su confirmación no coinciden");
        }
        if (pwd1.length() <= 5) {
            throw new IllegalArgumentException("La contraseña debe tener al menos cinco caracteres");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new DataIntegrityViolationException("Ese correo electrónico ya está siendo utilizado");
        }
        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(pwd1));
        u = userRepository.save(u);
    return new RegisterResult(u.getId(), u.getEmail(), null);
    }

    public User loginByEmail(String email, String rawPassword) {
        if (email == null || rawPassword == null) return null;
        Optional<User> opt = userRepository.findByEmail(email.trim());
        if (opt.isEmpty()) return null;
        User u = opt.get();
        // Email verification disabled per simplified flow
        if (passwordEncoder.matches(rawPassword.trim(), u.getPassword())) {
            return u;
        }
        return null;
    }

    public void removeUser(Long userId) {
        if (userId == null) return;
        userRepository.deleteById(userId);
    }

    public boolean resetPasswordByEmail(String email, String newPassword) {
        if (email == null || email.isBlank()) return false;
        if (newPassword == null || newPassword.trim().length() <= 5) return false;
        Optional<User> opt = userRepository.findByEmail(email.trim());
        if (opt.isEmpty()) return false;
        User user = opt.get();
        String trimmed = newPassword.trim();
        if (passwordEncoder.matches(trimmed, user.getPassword())) {
            throw new IllegalArgumentException("La nueva contraseña no puede ser igual a la anterior");
        }
        user.setPassword(passwordEncoder.encode(trimmed));
        userRepository.save(user);
        return true;
    }
}
