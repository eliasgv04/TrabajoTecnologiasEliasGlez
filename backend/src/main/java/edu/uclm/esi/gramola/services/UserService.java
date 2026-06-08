package edu.uclm.esi.gramola.services;

/**
 * Servicio de negocio de usuarios: validación, registro, verificación por email y recuperación de contraseña.
 */

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
    private final UrlService urlService;

    // Expresión regular para validar que el email tiene formato correcto antes de guardarlo.
    private static final Pattern EMAIL_REGEX = Pattern.compile("^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$");

    public UserService(UserRepository userRepository, BarSettingsRepository settingsRepository,
            PasswordEncoder passwordEncoder,
            VerificationTokenRepository tokenRepo, PasswordResetTokenRepository resetRepo,
            MailService mail, UrlService urlService) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepo = tokenRepo;
        this.resetRepo = resetRepo;
        this.mail = mail;
        this.urlService = urlService;
    }

    // Valida email y contraseña, crea el usuario con contraseña hasheada, genera un token de
    // verificación con 2 días de validez, lo persiste y envía el email. El usuario queda
    // en estado no verificado hasta que haga clic en el enlace.
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
            throw new IllegalArgumentException("La contraseña debe tener al menos seis caracteres");
        }
        pwd1 = pwd1.trim();
        pwd2 = pwd2.trim();
        if (!pwd1.equals(pwd2)) {
            throw new IllegalArgumentException("La contraseña y su confirmación no coinciden");
        }
        if (pwd1.length() <= 5) {
            throw new IllegalArgumentException("La contraseña debe tener al menos seis caracteres");
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new DataIntegrityViolationException("Ese correo electrónico ya está siendo utilizado");
        }
        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(pwd1)); // BCrypt: nunca se guarda la contraseña en claro
        u.setVerified(false);
        u = userRepository.save(u);

        // Token UUID sin guiones: más limpio en la URL del email
        String tokenStr = UUID.randomUUID().toString().replace("-", "");
        VerificationToken vt = new VerificationToken();
        vt.setToken(tokenStr);
        vt.setUser(u);
        vt.setExpiresAt(LocalDateTime.now().plusDays(2));
        tokenRepo.save(vt);

        String verifyUrl = this.urlService.withPath("User Verify Endpoint", "?token=" + tokenStr);
        mail.sendVerificationEmail(u.getEmail(), verifyUrl);

        return new RegisterResult(u.getId(), u.getEmail(), null);
    }

    public Optional<User> findUserByEmail(String email) {
        if (email == null)
            return Optional.empty();
        return userRepository.findByEmailIgnoreCase(email.trim());
    }

    // Busca un usuario por email o por nombre de bar. Permite que el login funcione
    // tanto con el email del propietario como con el nombre del local.
    public Optional<User> findUserByIdentifier(String identifier) {
        if (identifier == null)
            return Optional.empty();
        String id = identifier.trim();
        if (id.isEmpty())
            return Optional.empty();

        // Intenta primero por email (caso más frecuente)
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(id);
        if (byEmail.isPresent())
            return byEmail;

        // Si no hay email coincidente, busca por nombre de bar en bar_settings
        return settingsRepository.findFirstByBarNameIgnoreCase(id).map(BarSettings::getUser);
    }

    public User loginByEmail(String email, String rawPassword) {
        if (email == null || rawPassword == null)
            return null;
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email.trim());
        if (opt.isEmpty())
            return null;
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
        if (identifier == null || rawPassword == null)
            return null;
        Optional<User> opt = findUserByIdentifier(identifier);
        if (opt.isEmpty())
            return null;
        User u = opt.get();
        if (!u.isVerified())
            return null;
        return passwordEncoder.matches(rawPassword.trim(), u.getPassword()) ? u : null;
    }

    // Valida el token del enlace de verificación. Si es válido y no ha caducado,
    // marca al usuario como verificado y elimina el token para que no pueda usarse dos veces.
    @Transactional
    public boolean verifyToken(String token) {
        if (token == null || token.isBlank())
            return false;
        var opt = tokenRepo.findByToken(token.trim());
        if (opt.isEmpty())
            return false;
        VerificationToken vt = opt.get();
        if (vt.getExpiresAt() != null && vt.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepo.delete(vt); // token caducado: se limpia de BD
            return false;
        }
        User u = vt.getUser();
        u.setVerified(true);
        userRepository.save(u);
        tokenRepo.delete(vt); // token consumido: se elimina para evitar reuso
        return true;
    }

    public void removeUser(Long userId) {
        if (userId == null)
            return;
        userRepository.deleteById(userId);
    }

    public boolean resetPasswordByEmail(String email, String newPassword) {
        if (email == null || email.isBlank())
            return false;
        if (newPassword == null || newPassword.trim().length() <= 5)
            return false;
        Optional<User> opt = userRepository.findByEmail(email.trim());
        if (opt.isEmpty())
            return false;
        User user = opt.get();
        String trimmed = newPassword.trim();
        if (passwordEncoder.matches(trimmed, user.getPassword())) {
            throw new IllegalArgumentException("La nueva contraseña no puede ser igual a la anterior");
        }
        user.setPassword(passwordEncoder.encode(trimmed));
        userRepository.save(user);
        return true;
    }

    // Genera un token de recuperación con 2 horas de validez y envía el email.
    // Si el email no existe, el método retorna sin hacer nada y sin lanzar error,
    // para no revelar al atacante qué cuentas están registradas.
    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank())
            return;
        Optional<User> opt = userRepository.findByEmail(email.trim());
        if (opt.isEmpty())
            return;
        User u = opt.get();
        String tokenStr = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(tokenStr);
        prt.setUser(u);
        prt.setExpiresAt(LocalDateTime.now().plusHours(2));
        resetRepo.save(prt);

        String resetUrl = this.urlService.withPath("Password Reset", "?token=" + tokenStr);
        mail.sendPasswordResetEmail(u.getEmail(), resetUrl);
    }

    @Transactional
    public boolean resetPasswordByToken(String token, String pwd1, String pwd2) {
        if (token == null || token.isBlank())
            return false;
        if (pwd1 == null || pwd2 == null)
            return false;
        String p1 = pwd1.trim();
        String p2 = pwd2.trim();
        if (!p1.equals(p2))
            throw new IllegalArgumentException("Las contraseñas no coinciden");
        if (p1.length() <= 5)
            throw new IllegalArgumentException("La contraseña debe tener al menos seis caracteres");

        var opt = resetRepo.findByToken(token.trim());
        if (opt.isEmpty())
            return false;
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
