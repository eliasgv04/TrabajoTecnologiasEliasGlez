package edu.uclm.esi.gramola.http;

/**
 * Controlador REST de suscripciones: listado de planes, estado, pago y activación de suscripción.
 */

import edu.uclm.esi.gramola.dao.SubscriptionPlanRepository;
import edu.uclm.esi.gramola.dao.UserRepository;
import edu.uclm.esi.gramola.dao.UserSubscriptionRepository;
import edu.uclm.esi.gramola.entities.SubscriptionPlan;
import edu.uclm.esi.gramola.entities.User;
import edu.uclm.esi.gramola.entities.UserSubscription;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/subscriptions")
public class SubscriptionsController {
    private final SubscriptionPlanRepository plans;
    private final UserRepository users;
    private final UserSubscriptionRepository subsRepo;

    @Value("${stripe.secretKey:}")
    private String stripeSecretKey;

    public SubscriptionsController(SubscriptionPlanRepository plans, UserRepository users,
                                   UserSubscriptionRepository subsRepo) {
        this.plans = plans;
        this.users = users;
        this.subsRepo = subsRepo;
    }

    @GetMapping(path = "/plans", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<SubscriptionPlan> listPlans() {
        return plans.findAll();
    }

    @GetMapping(path = "/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> status(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debes iniciar sesión");
        Long userId = (Long) userIdObj;
        LocalDateTime now = LocalDateTime.now();
        boolean active = subsRepo.countByUserIdAndEndAtAfter(userId, now) > 0;
        LocalDateTime until = null;
        // Find latest ACTIVE subscription to extract endAt
        var lastActive = subsRepo.findFirstByUserIdAndStatusOrderByEndAtDesc(userId, UserSubscription.Status.ACTIVE).orElse(null);
        if (lastActive != null) {
            until = lastActive.getEndAt();
        }
        return Map.of("active", active, "activeUntil", until != null ? until.toString() : null);
    }

    @GetMapping(path = "/prepay", produces = MediaType.TEXT_PLAIN_VALUE)
    public String prepay(HttpSession session, @RequestParam("planId") Long planId) {
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debes iniciar sesión");
        Long userId = (Long) userIdObj;
        // Block if already active
        LocalDateTime now = LocalDateTime.now();
        if (subsRepo.countByUserIdAndEndAtAfter(userId, now) > 0) {
            var lastActive = subsRepo.findFirstByUserIdAndStatusOrderByEndAtDesc(userId, UserSubscription.Status.ACTIVE).orElse(null);
            String until = (lastActive != null && lastActive.getEndAt() != null) ? lastActive.getEndAt().toString() : null;
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya tienes una suscripción activa" + (until != null ? " hasta " + until : ""));
        }
        SubscriptionPlan plan = plans.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe no configurado en el servidor");
        }
        try {
            com.stripe.Stripe.apiKey = stripeSecretKey;
            long amountCents = (long) plan.getPriceEur() * 100L;
            com.stripe.param.PaymentIntentCreateParams params =
                    com.stripe.param.PaymentIntentCreateParams.builder()
                            .setCurrency("eur")
                            .setAmount(amountCents)
                            .build();
            com.stripe.model.PaymentIntent intent = com.stripe.model.PaymentIntent.create(params);
            String clientSecret = intent.getClientSecret();
            session.setAttribute("sub_client_secret", clientSecret);
            session.setAttribute("sub_plan_id", plan.getId());
            return clientSecret;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe error: " + e.getMessage());
        }
    }

    @GetMapping(path = "/confirm", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> confirm(HttpSession session) {
        Object userIdObj = session.getAttribute("userId");
        Object cs = session.getAttribute("sub_client_secret");
        Object planIdObj = session.getAttribute("sub_plan_id");
        if (userIdObj == null || cs == null || planIdObj == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Transacción no iniciada");
        }
        Long userId = (Long) userIdObj;
        Long planId = (Long) planIdObj;
        User u = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        SubscriptionPlan plan = plans.findById(planId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));

        LocalDateTime now = LocalDateTime.now();
        // Block confirm if user somehow is already active to avoid overlapping subscriptions
        if (subsRepo.countByUserIdAndEndAtAfter(userId, now) > 0) {
            session.removeAttribute("sub_client_secret");
            session.removeAttribute("sub_plan_id");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya tienes una suscripción activa");
        }
        LocalDateTime end = now.plusMonths(plan.getDurationMonths());
        UserSubscription sub = new UserSubscription();
        sub.setUser(u);
        sub.setPlan(plan);
        sub.setStatus(UserSubscription.Status.ACTIVE);
        sub.setStartAt(now);
        sub.setEndAt(end);
        subsRepo.save(sub);

        // Credit monthly coins upfront for the plan duration (benefit of subscription)
        int monthlyCoins;
        String code = plan.getCode() != null ? plan.getCode().toUpperCase() : "";
        if ("ANNUAL".equals(code)) {
            monthlyCoins = 30; // más valor para el usuario
        } else {
            monthlyCoins = 30; // default / MONTHLY
        }
        int creditedCoins = monthlyCoins * Math.max(1, plan.getDurationMonths());
        try {
            u.setCoins(u.getCoins() + creditedCoins);
            users.save(u);
        } catch (Exception ignore) {}

        session.removeAttribute("sub_client_secret");
        session.removeAttribute("sub_plan_id");
        return Map.of("message", "Suscripción activada", "activeUntil", end.toString(), "creditedCoins", creditedCoins);
    }
}
