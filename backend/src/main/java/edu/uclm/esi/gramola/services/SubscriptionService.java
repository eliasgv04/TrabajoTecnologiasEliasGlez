package edu.uclm.esi.gramola.services;

/**
 * Servicio de negocio relacionado con suscripciones (lógica auxiliar/consultas).
 */

import edu.uclm.esi.gramola.dao.UserSubscriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class SubscriptionService {
    private final UserSubscriptionRepository subsRepo;

    public SubscriptionService(UserSubscriptionRepository subsRepo) {
        this.subsRepo = subsRepo;
    }

    public boolean hasActive(Long userId) {
        if (userId == null) return false;
        return subsRepo.countByUserIdAndEndAtAfter(userId, LocalDateTime.now()) > 0;
    }

    public void requireActive(Long userId) {
        if (!hasActive(userId)) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Necesitas una suscripción activa");
        }
    }
}
