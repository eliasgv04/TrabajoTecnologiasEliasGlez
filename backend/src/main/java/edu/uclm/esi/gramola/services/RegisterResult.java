package edu.uclm.esi.gramola.services;

public record RegisterResult(Long id, String email, String verificationToken) {}
