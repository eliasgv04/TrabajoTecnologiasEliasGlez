package edu.uclm.esi.gramola.http;

/**
 * Controlador REST de pagos de canciones: crea PaymentIntents y confirma pagos puntuales.
 */

import edu.uclm.esi.gramola.dao.SongPaymentRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.entities.SongPayment;
import edu.uclm.esi.gramola.entities.User;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentsController {
    private final UserRepository users;
    private final SongPaymentRepository songPayments;

    @Value("${stripe.secretKey:}")
    private String stripeSecretKey; // no usada en modo simulado

    @Value("${stripe.publishableKey:}")
    private String stripePublishableKey; // expuesta al front opcionalmente

    public PaymentsController(UserRepository users, SongPaymentRepository songPayments) {
        this.users = users;
        this.songPayments = songPayments;
    }

    // Devuelve la publishable key por si el front quiere mostrarla o usar Stripe real
    @GetMapping("/public-key")
    public Map<String, String> publicKey() {
        return Map.of("publishableKey", stripePublishableKey == null ? "" : stripePublishableKey);
    }

    // Simulación del prepay: valida el pago de una canción concreta, genera un client_secret y lo guarda en sesión
    @GetMapping(path = "/prepay", produces = MediaType.TEXT_PLAIN_VALUE)
    public String prepay(HttpSession session, @RequestParam("trackId") String trackId, @RequestParam("amountEur") int amountEur) {
        if (session.getAttribute("userId") == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debes iniciar sesión");
        }
        if (trackId == null || trackId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "trackId obligatorio");
        }
        if (amountEur < 1 || amountEur > 3) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Importe de canción no válido");
        }
        long amountCents = amountEur * 100L;
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe no configurado en el servidor");
        }
        try {
            com.stripe.Stripe.apiKey = stripeSecretKey;
            com.stripe.param.PaymentIntentCreateParams params =
                    com.stripe.param.PaymentIntentCreateParams.builder()
                            .setCurrency("eur")
                            .setAmount(amountCents)
                            .build();
            com.stripe.model.PaymentIntent intent = com.stripe.model.PaymentIntent.create(params);
            String clientSecret = intent.getClientSecret();
            Long userId = (Long) session.getAttribute("userId");
            User user = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

            SongPayment payment = new SongPayment();
            payment.setUser(user);
            payment.setTrackId(trackId);
            payment.setAmountEur(amountEur);
            payment.setClientSecret(clientSecret);
            payment.setStatus(SongPayment.Status.PENDING);
            songPayments.save(payment);

            session.setAttribute("song_payment_client_secret", clientSecret);
            session.setAttribute("song_payment_track_id", trackId);
            session.setAttribute("song_payment_amount_eur", amountEur);
            return clientSecret;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe error: " + e.getMessage());
        }
    }

    // Confirmación simulada: marca el pago de la canción como completado
    @GetMapping("/confirm")
    public Map<String, Object> confirm(HttpSession session) {
        Object cs = session.getAttribute("song_payment_client_secret");
        if (cs == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Transacción no iniciada");
        }
        String clientSecret = cs.toString();
        SongPayment payment = songPayments.findByClientSecret(clientSecret)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago no encontrado"));

        payment.setStatus(SongPayment.Status.CONFIRMED);
        payment.setConfirmedAt(Instant.now());
        songPayments.save(payment);

        session.removeAttribute("song_payment_client_secret");
        session.removeAttribute("song_payment_track_id");
        session.removeAttribute("song_payment_amount_eur");

        return Map.of("message", "Pago confirmado", "trackId", payment.getTrackId(), "amountEur", payment.getAmountEur(), "paymentId", payment.getId());
    }
}
