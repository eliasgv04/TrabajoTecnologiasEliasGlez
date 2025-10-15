package edu.uclm.esi.gramola.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private int pricePerSong = 1;

    public int getPricePerSong() {
        return pricePerSong;
    }

    public void setPricePerSong(int pricePerSong) {
        this.pricePerSong = pricePerSong;
    }
}
