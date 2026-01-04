package edu.uclm.esi.gramola.services;

/**
 * Resultado del registro de usuario (datos mínimos devueltos al controlador).
 */

public record RegisterResult(Long id, String email, String verificationToken) {}
