package edu.uclm.esi.gramola.services;

/**
 * Servicio de envío de correos (verificación y recuperación de contraseña).
 */

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

@Service
public class MailService {
    private static final Logger log = LoggerFactory.getLogger(MailService.class);
    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@gramola.local}")
    private String from;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationEmail(String to, String verifyUrl) {
        String subject = "Verifica tu cuenta - Gramola";
        String text = "Bienvenido/a a Gramola.\n\n" +
                "Por favor, verifica tu cuenta haciendo clic en este enlace:\n" + verifyUrl + "\n\n" +
                "Si no has solicitado esta cuenta, puedes ignorar este correo.";
        send(to, subject, text);
    }

    @Async
    public void sendPasswordResetEmail(String to, String resetUrl) {
        String subject = "Restablecer contraseña - Gramola";
        String text = "Has solicitado restablecer tu contraseña.\n\n" +
                "Haz clic en este enlace para establecer una nueva contraseña:\n" + resetUrl + "\n\n" +
                "Si no has solicitado este cambio, puedes ignorar este correo.";
        send(to, subject, text);
    }

    private void send(String to, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
            log.info("Email enviado a {}: {}", to, subject);
        } catch (MailException ex) {
            // No bloquear desarrollo si SMTP no está configurado
            log.warn("No se pudo enviar el email a {}: {}", to, ex.getMessage());
        }
    }
}
