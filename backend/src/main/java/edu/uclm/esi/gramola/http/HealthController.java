package edu.uclm.esi.gramola.http;

/**
 * Controlador REST simple para comprobación de estado (health check) del backend.
 */

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public String health() {
        return "OK";
    }
}
