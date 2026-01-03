package edu.uclm.esi.gramola.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spotify")
public class SpotifyProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String stateSecret;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

    public String getRedirectUri() { return redirectUri; }
    public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }

    public String getStateSecret() { return stateSecret; }
    public void setStateSecret(String stateSecret) { this.stateSecret = stateSecret; }
}
