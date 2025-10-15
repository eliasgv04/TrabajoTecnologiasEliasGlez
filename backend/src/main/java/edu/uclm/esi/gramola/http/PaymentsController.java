package edu.uclm.esi.gramola.http;

import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.entities.User;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentsController {
    private final UserRepository users;

    @Value("${stripe.secretKey:}")
    private String stripeSecretKey; // no usada en modo simulado

    @Value("${stripe.publishableKey:}")
    private String stripePublishableKey; // expuesta al front opcionalmente

    public PaymentsController(UserRepository users) {
        this.users = users;
    }

    // Devuelve la publishable key por si el front quiere mostrarla o usar Stripe real
    @GetMapping("/public-key")
    public Map<String, String> publicKey() {
        return Map.of("publishableKey", stripePublishableKey == null ? "" : stripePublishableKey);
    }

    // Simulación del prepay: valida la compra (10 o 20), genera un client_secret y lo guarda en sesión
    @GetMapping(path = "/prepay", produces = MediaType.TEXT_PLAIN_VALUE)
    public String prepay(HttpSession session, @RequestParam("matches") int matches) {
        if (session.getAttribute("userId") == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debes iniciar sesión");
        }
        if (matches != 10 && matches != 20) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede comprar 10 o 20 canciones");
        }
        long totalEur = (matches == 10) ? 10 : 15; // 10 canciones = 10€, 20 canciones = 15€
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe no configurado en el servidor");
        }
        try {
            com.stripe.Stripe.apiKey = stripeSecretKey;
            long amountCents = totalEur * 100;
            com.stripe.param.PaymentIntentCreateParams params =
                    com.stripe.param.PaymentIntentCreateParams.builder()
                            .setCurrency("eur")
                            .setAmount(amountCents)
                            .build();
            com.stripe.model.PaymentIntent intent = com.stripe.model.PaymentIntent.create(params);
            String clientSecret = intent.getClientSecret();
            session.setAttribute("client_secret", clientSecret);
            session.setAttribute("matches", matches);
            session.setAttribute("total_eur", totalEur);
            return clientSecret;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe error: " + e.getMessage());
        }
    }

    // Confirmación simulada: añade 'matches' monedas al usuario activo
    @GetMapping("/confirm")
    public Map<String, Object> confirm(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        Object cs = session.getAttribute("client_secret");
        Object matchesObj = session.getAttribute("matches");
        if (userIdObj == null || cs == null || matchesObj == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Transacción no iniciada");
        }
    Long userId = (Long) userIdObj;
    int matches = (Integer) matchesObj;
    User u = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    // En un flujo real, Stripe confirmaría el intent en el cliente con la publishable key.
    // Aquí asumimos que ha sido 'succeeded' y recargamos monedas.
    u.setCoins(u.getCoins() + matches); // añadimos monedas como "canciones prepagadas"
    users.save(u);
        // limpiar la transacción de la sesión
        session.removeAttribute("client_secret");
        session.removeAttribute("matches");
        session.removeAttribute("total_eur");
        return Map.of("message", "Pago confirmado", "coins", u.getCoins());
    }
}
