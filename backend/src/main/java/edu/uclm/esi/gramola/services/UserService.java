package edu.uclm.esi.gramola.services;

import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.dao.VerificationTokenRepository;
import edu.uclm.esi.gramola.dao.PasswordResetTokenRepository;
import edu.uclm.esi.gramola.dao.BarSettingsRepository;
import edu.uclm.esi.gramola.entities.User;
import edu.uclm.esi.gramola.entities.BarSettings;
import edu.uclm.esi.gramola.entities.VerificationToken;
import edu.uclm.esi.gramola.entities.PasswordResetToken;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BarSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository tokenRepo;
    private final PasswordResetTokenRepository resetRepo;
    private final MailService mail;

    private static final Pattern EMAIL_REGEX = Pattern.compile("^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$");

    public UserService(UserRepository userRepository, BarSettingsRepository settingsRepository, PasswordEncoder passwordEncoder,
                       VerificationTokenRepository tokenRepo, PasswordResetTokenRepository resetRepo,
                       MailService mail) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepo = tokenRepo;
        this.resetRepo = resetRepo;
        this.mail = mail;
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
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new DataIntegrityViolationException("Ese correo electrónico ya está siendo utilizado");
        }
        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(pwd1));
        u.setVerified(false);
        u = userRepository.save(u);

        // Crear token y enviar email de verificación
        String tokenStr = UUID.randomUUID().toString().replace("-", "");
        VerificationToken vt = new VerificationToken();
        vt.setToken(tokenStr);
        vt.setUser(u);
        vt.setExpiresAt(LocalDateTime.now().plusDays(2));
        tokenRepo.save(vt);

        String verifyUrl = "https://localhost:8000/users/verify?token=" + tokenStr;
        mail.sendVerificationEmail(u.getEmail(), verifyUrl);

        return new RegisterResult(u.getId(), u.getEmail(), null);
    }

    public Optional<User> findUserByEmail(String email) {
        if (email == null) return Optional.empty();
        return userRepository.findByEmailIgnoreCase(email.trim());
    }

    public Optional<User> findUserByIdentifier(String identifier) {
        if (identifier == null) return Optional.empty();
        String id = identifier.trim();
        if (id.isEmpty()) return Optional.empty();

        // 1) Email
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(id);
        if (byEmail.isPresent()) return byEmail;

        // 2) Bar name (stored in bar_settings)
        return settingsRepository.findFirstByBarNameIgnoreCase(id).map(BarSettings::getUser);
    }

    public User loginByEmail(String email, String rawPassword) {
        if (email == null || rawPassword == null) return null;
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email.trim());
        if (opt.isEmpty()) return null;
        User u = opt.get();
        if (!u.isVerified()) {
            return null;
        }
        if (passwordEncoder.matches(rawPassword.trim(), u.getPassword())) {
            return u;
        }
        return null;
    }

    public User loginByIdentifier(String identifier, String rawPassword) {
        if (identifier == null || rawPassword == null) return null;
        Optional<User> opt = findUserByIdentifier(identifier);
        if (opt.isEmpty()) return null;
        User u = opt.get();
        if (!u.isVerified()) return null;
        return passwordEncoder.matches(rawPassword.trim(), u.getPassword()) ? u : null;
    }

    @Transactional
    public boolean verifyToken(String token) {
        if (token == null || token.isBlank()) return false;
        var opt = tokenRepo.findByToken(token.trim());
        if (opt.isEmpty()) return false;
        VerificationToken vt = opt.get();
        if (vt.getExpiresAt() != null && vt.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepo.delete(vt);
            return false;
        }
        User u = vt.getUser();
        u.setVerified(true);
        userRepository.save(u);
        tokenRepo.delete(vt);
        return true;
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

    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) return;
        Optional<User> opt = userRepository.findByEmail(email.trim());
        if (opt.isEmpty()) return; // No revelar si existe o no
        User u = opt.get();
        // invalidar tokens previos si quieres (opcional)
        // crear nuevo token
        String tokenStr = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(tokenStr);
        prt.setUser(u);
        prt.setExpiresAt(LocalDateTime.now().plusHours(2));
        resetRepo.save(prt);

        String resetUrl = "https://localhost:4200/reset?token=" + tokenStr;
        mail.sendPasswordResetEmail(u.getEmail(), resetUrl);
    }

    @Transactional
    public boolean resetPasswordByToken(String token, String pwd1, String pwd2) {
        if (token == null || token.isBlank()) return false;
        if (pwd1 == null || pwd2 == null) return false;
        String p1 = pwd1.trim();
        String p2 = pwd2.trim();
        if (!p1.equals(p2)) throw new IllegalArgumentException("Las contraseñas no coinciden");
        if (p1.length() <= 5) throw new IllegalArgumentException("La contraseña debe tener al menos cinco caracteres");

        var opt = resetRepo.findByToken(token.trim());
        if (opt.isEmpty()) return false;
        PasswordResetToken prt = opt.get();
        if (prt.getExpiresAt() != null && prt.getExpiresAt().isBefore(LocalDateTime.now())) {
            resetRepo.delete(prt);
            return false;
        }
        User u = prt.getUser();
        if (passwordEncoder.matches(p1, u.getPassword())) {
            throw new IllegalArgumentException("La nueva contraseña no puede ser igual a la anterior");
        }
        u.setPassword(passwordEncoder.encode(p1));
        userRepository.save(u);
        resetRepo.delete(prt);
        return true;
    }
}
