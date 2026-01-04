package edu.uclm.esi.gramola.http;

/**
 * Manejador global de excepciones: unifica la respuesta de error en JSON ({status, error, path}).
 */

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleRse(ResponseStatusException ex, HttpServletRequest req) {
        int code = ex.getStatusCode().value();
        String msg = ex.getReason() != null ? ex.getReason() : "Error";
        if (code >= 500) {
            log.error("RSE {} at {}: {}", code, safePath(req), msg);
        } else {
            log.warn("RSE {} at {}: {}", code, safePath(req), msg);
        }
        return ResponseEntity.status(code).body(Map.of(
                "status", code,
            "message", msg,
                "error", msg,
                "path", safePath(req)
        ));
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String, Object>> handleNpe(NullPointerException ex, HttpServletRequest req) {
        log.error("NullPointerException at {}", safePath(req), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "message", "Error interno",
                "error", "Error interno",
                "path", safePath(req)
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAny(Exception ex, HttpServletRequest req) {
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank()) ? ex.getMessage() : "Error";
        log.error("Unhandled exception at {}: {}", safePath(req), msg, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "message", msg,
                "error", msg,
                "path", safePath(req)
        ));
    }

    private String safePath(HttpServletRequest req) {
        try { return req.getRequestURI(); } catch (Exception ignore) { return ""; }
    }
}
